-- Commission Calculation Trigger
-- Automatically calculates and records affiliate commission when a bet is placed

-- Function to process commission
CREATE OR REPLACE FUNCTION public.process_affiliate_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_commission_amount DECIMAL;
  v_edge DECIMAL;
  v_commission_rate DECIMAL := 0.10; -- Default 10% commission rate
  v_game_type TEXT;
BEGIN
  -- 1. Check if user has a referrer
  SELECT referred_by_user_id INTO v_referrer_id
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If no referrer, exit
  IF v_referrer_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 2. Determine House Edge based on game type
  v_game_type := LOWER(NEW.game_type);
  
  CASE 
    WHEN v_game_type LIKE '%blackjack%' THEN v_edge := 0.005; -- 0.5%
    WHEN v_game_type LIKE '%roulette%' THEN v_edge := 0.027; -- 2.7%
    WHEN v_game_type LIKE '%slots%' THEN v_edge := 0.04; -- 4.0%
    WHEN v_game_type LIKE '%mines%' THEN v_edge := 0.01; -- 1.0%
    WHEN v_game_type LIKE '%dice%' THEN v_edge := 0.01; -- 1.0%
    WHEN v_game_type LIKE '%plinko%' THEN v_edge := 0.01; -- 1.0%
    WHEN v_game_type LIKE '%crash%' THEN v_edge := 0.01; -- 1.0%
    WHEN v_game_type LIKE '%limbo%' THEN v_edge := 0.01; -- 1.0%
    WHEN v_game_type LIKE '%keno%' THEN v_edge := 0.01; -- 1.0%
    ELSE v_edge := 0.01; -- Default 1%
  END CASE;

  -- 3. Calculate Commission
  -- Formula: (Edge * Bet Amount / 2) * Commission Rate
  -- We divide by 2 because commission is usually shared or based on theoretical profit
  v_commission_amount := (v_edge * NEW.stake_credits / 2) * v_commission_rate;

  -- 4. Record Earnings
  IF v_commission_amount > 0 THEN
    INSERT INTO public.affiliate_earnings (
      user_id,
      referred_user_id,
      currency,
      amount,
      source_type,
      source_id,
      commission_rate
    ) VALUES (
      v_referrer_id,
      NEW.user_id,
      'USD', -- Default currency for credits
      v_commission_amount,
      'casino',
      NEW.id,
      v_commission_rate
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the bet
    RAISE WARNING 'Error processing affiliate commission: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger on Bets table
DROP TRIGGER IF EXISTS trg_process_affiliate_commission ON public.bets;
CREATE TRIGGER trg_process_affiliate_commission
  AFTER INSERT ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.process_affiliate_commission();
