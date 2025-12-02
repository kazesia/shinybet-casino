-- Secure all RPC functions by setting explicit search_path
-- This resolves the "Mutable Search Path" security advisories

-- 1. Secure increment_balance
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.wallets
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$;

-- 2. Secure place_sports_bet
CREATE OR REPLACE FUNCTION public.place_sports_bet(
    p_event_id uuid,
    p_selection_name text,
    p_odds numeric,
    p_stake numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_balance numeric;
    v_bet_id uuid;
BEGIN
    -- Get user ID from auth context
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check balance
    SELECT credits INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
    
    IF v_balance IS NULL OR v_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct stake
    UPDATE public.wallets 
    SET credits = credits - p_stake 
    WHERE user_id = v_user_id;

    -- Create bet record
    INSERT INTO public.sports_bets (
        user_id,
        event_id,
        selection_name,
        odds,
        stake,
        potential_payout,
        status
    ) VALUES (
        v_user_id,
        p_event_id,
        p_selection_name,
        p_odds,
        p_stake,
        p_stake * p_odds,
        'pending'
    ) RETURNING id INTO v_bet_id;

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_balance - p_stake
    );
END;
$function$;

-- 3. Secure request_withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(p_user_id uuid, p_amount numeric, p_currency text, p_address text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
BEGIN
  -- Check balance
  SELECT credits INTO v_balance FROM public.wallets WHERE user_id = p_user_id;
  
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Deduct funds immediately
  UPDATE public.wallets 
  SET credits = credits - p_amount 
  WHERE user_id = p_user_id;

  -- Create withdrawal record
  INSERT INTO public.withdrawals (user_id, amount_credits, currency, target_address, status)
  VALUES (p_user_id, p_amount, p_currency, p_address, 'pending');
END;
$function$;

-- 4. Secure admin_summary
CREATE OR REPLACE FUNCTION public.admin_summary()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_users int;
  v_active_users_24h int;
  v_total_deposits numeric;
  v_total_withdrawals numeric;
  v_total_wagered numeric;
  v_house_edge_profit numeric;
  v_net_profit numeric;
BEGIN
  -- Check admin role (basic check, RLS handles row access but this is an aggregate)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT count(*) INTO v_total_users FROM auth.users;
  
  -- Active users (users who logged in within 24h)
  -- Note: This relies on last_sign_in_at which might not be updated on every request in all auth setups, 
  -- but is good enough for stats. Alternatively join with sessions if available.
  SELECT count(*) INTO v_active_users_24h FROM auth.users 
  WHERE last_sign_in_at > (now() - interval '24 hours');

  SELECT COALESCE(sum(amount_credits), 0) INTO v_total_deposits FROM public.deposits WHERE status = 'confirmed';
  SELECT COALESCE(sum(amount_credits), 0) INTO v_total_withdrawals FROM public.withdrawals WHERE status = 'paid';
  
  -- Calculate Wagered from bets table
  SELECT COALESCE(sum(stake_credits), 0) INTO v_total_wagered FROM public.bets;
  
  -- Estimate House Edge (e.g. 1% of wagered) - This is theoretical
  v_house_edge_profit := v_total_wagered * 0.01;

  -- Net Profit = Deposits - Withdrawals (Cash flow based)
  -- OR (Total Lost Bets - Total Won Payouts)
  -- Let's use Cash Flow for this metric
  v_net_profit := v_total_deposits - v_total_withdrawals;

  RETURN json_build_object(
    'total_users', v_total_users,
    'active_users_24h', v_active_users_24h,
    'total_deposits', v_total_deposits,
    'total_withdrawals', v_total_withdrawals,
    'total_wagered', v_total_wagered,
    'house_edge_profit', v_house_edge_profit,
    'net_profit', v_net_profit
  );
END;
$function$;
