-- Affiliate System Functions (Fixed for Supabase)

-- Function to calculate commission based on bet type
CREATE OR REPLACE FUNCTION public.calculate_commission(
  p_bet_amount DECIMAL,
  p_edge DECIMAL,
  p_commission_rate DECIMAL,
  p_source_type TEXT
) RETURNS DECIMAL AS $$
BEGIN
  CASE p_source_type
    WHEN 'casino' THEN
      -- Casino: (Edge * wagered / 2) * commission_rate
      RETURN (p_edge * p_bet_amount / 2) * p_commission_rate;
    WHEN 'sportsbook' THEN
      -- Sportsbook: (0.03 * wagered / 2) * commission_rate
      RETURN (0.03 * p_bet_amount / 2) * p_commission_rate;
    WHEN 'poker' THEN
      -- Poker: Rake * commission_rate (edge parameter is rake here)
      RETURN p_edge * p_commission_rate;
    ELSE
      RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get available commission balance for a user
CREATE OR REPLACE FUNCTION public.get_available_commission(
  p_user_id UUID,
  p_currency TEXT
) RETURNS DECIMAL AS $$
DECLARE
  v_total_earned DECIMAL;
  v_total_withdrawn DECIMAL;
BEGIN
  -- Calculate total earned
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_earned
  FROM public.affiliate_earnings
  WHERE user_id = p_user_id AND currency = p_currency;
  
  -- Calculate total withdrawn
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_withdrawn
  FROM public.affiliate_commission_transfers
  WHERE user_id = p_user_id AND currency = p_currency AND status = 'completed';
  
  RETURN v_total_earned - v_total_withdrawn;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get total wagered by referred users
CREATE OR REPLACE FUNCTION public.get_referred_users_wagered(
  p_user_id UUID
) RETURNS TABLE (
  currency TEXT,
  total_wagered DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.currency,
    COALESCE(SUM(b.bet_amount), 0) as total_wagered
  FROM public.profiles u
  INNER JOIN public.bets b ON b.user_id = u.id
  WHERE u.referred_by_user_id = p_user_id
  GROUP BY b.currency;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to safely transfer commission to balance
CREATE OR REPLACE FUNCTION public.transfer_commission_to_balance(
  p_user_id UUID,
  p_amount DECIMAL,
  p_currency TEXT
) RETURNS JSON AS $$
DECLARE
  v_available DECIMAL;
  v_transfer_id UUID;
  v_current_balance DECIMAL;
BEGIN
  -- Get available commission
  v_available := public.get_available_commission(p_user_id, p_currency);
  
  -- Check if enough funds available
  IF v_available < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient commission balance',
      'available', v_available
    );
  END IF;
  
  -- Create transfer record
  INSERT INTO public.affiliate_commission_transfers (user_id, amount, currency, status)
  VALUES (p_user_id, p_amount, p_currency, 'pending')
  RETURNING id INTO v_transfer_id;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Update user balance
  UPDATE public.profiles
  SET balance = balance + p_amount
  WHERE id = p_user_id;
  
  -- Mark transfer as completed
  UPDATE public.affiliate_commission_transfers
  SET status = 'completed'
  WHERE id = v_transfer_id;
  
  RETURN json_build_object(
    'success', true,
    'transfer_id', v_transfer_id,
    'new_balance', v_current_balance + p_amount
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Mark transfer as failed if error occurs
  UPDATE public.affiliate_commission_transfers
  SET status = 'failed'
  WHERE id = v_transfer_id;
  
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Trigger function to automatically create referral_id for new users
CREATE OR REPLACE FUNCTION public.generate_referral_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_id IS NULL THEN
    NEW.referral_id := encode(gen_random_bytes(6), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS trg_generate_referral_id ON public.profiles;
CREATE TRIGGER trg_generate_referral_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_id();
