-- Fix function ambiguity by dropping specific signatures before re-creating
-- This resolves the "function name is not unique" error

-- 1. Fix increment_balance
-- Drop potential conflicting signatures
DROP FUNCTION IF EXISTS public.increment_balance(uuid, numeric);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, double precision);

-- Re-create with secure search_path
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
  SET credits = credits + p_amount,
      version = version + 1,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- 2. Fix place_sports_bet
DROP FUNCTION IF EXISTS public.place_sports_bet(uuid, uuid, text, numeric, numeric, numeric);

CREATE OR REPLACE FUNCTION public.place_sports_bet(
  p_user_id uuid,
  p_event_id uuid,
  p_selection_name text,
  p_odds numeric,
  p_stake numeric,
  p_potential_payout numeric
)
RETURNS json
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
  
  IF v_balance IS NULL OR v_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct stake
  UPDATE public.wallets
  SET credits = credits - p_stake,
      version = version + 1
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

  RETURN json_build_object('bet_id', v_bet_id, 'new_balance', v_balance - p_stake);
END;
$$;
