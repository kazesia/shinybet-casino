-- Drop conflicting functions explicitly to resolve return type errors
DROP FUNCTION IF EXISTS public.increment_balance(uuid, numeric);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, double precision);
DROP FUNCTION IF EXISTS public.place_sports_bet(uuid, uuid, text, numeric, numeric, numeric);

-- Recreate increment_balance securely
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  UPDATE public.wallets
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

-- Recreate place_sports_bet securely
CREATE OR REPLACE FUNCTION public.place_sports_bet(
    p_user_id uuid,
    p_event_id uuid,
    p_selection_name text,
    p_odds numeric,
    p_stake numeric,
    p_potential_payout numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance numeric;
    v_bet_id uuid;
BEGIN
    -- Check balance
    SELECT credits INTO v_balance FROM public.wallets WHERE user_id = p_user_id;
    
    IF v_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct stake
    UPDATE public.wallets 
    SET credits = credits - p_stake 
    WHERE user_id = p_user_id;

    -- Insert bet
    INSERT INTO public.sports_bets (
        user_id,
        event_id,
        selection_name,
        odds,
        stake,
        potential_payout,
        status
    ) VALUES (
        p_user_id,
        p_event_id,
        p_selection_name,
        p_odds,
        p_stake,
        p_potential_payout,
        'pending'
    ) RETURNING id INTO v_bet_id;

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_balance - p_stake
    );
END;
$$;

-- Secure other admin functions
CREATE OR REPLACE FUNCTION public.admin_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_users bigint;
  active_users bigint;
  total_wagered numeric;
  house_edge_profit numeric;
  net_profit numeric;
BEGIN
  SELECT count(*) INTO total_users FROM profiles;
  SELECT count(*) INTO active_users FROM profiles WHERE last_sign_in_at > (now() - interval '24 hours');
  
  -- Calculate stats from bets table
  SELECT COALESCE(SUM(stake_credits), 0) INTO total_wagered FROM bets;
  
  -- Theoretical house edge (1%)
  house_edge_profit := total_wagered * 0.01;
  
  -- Actual Net Profit (Total Wagered - Total Payouts)
  SELECT (COALESCE(SUM(stake_credits), 0) - COALESCE(SUM(payout_credits), 0)) 
  INTO net_profit 
  FROM bets;

  RETURN json_build_object(
    'total_users', total_users,
    'active_users_24h', active_users,
    'total_wagered', total_wagered,
    'house_edge_profit', house_edge_profit,
    'net_profit', net_profit
  );
END;
$$;
