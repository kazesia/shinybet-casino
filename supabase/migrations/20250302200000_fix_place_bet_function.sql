/*
  # Fix Place Sports Bet Function
  
  ## Query Description:
  1. Drops the existing `place_sports_bet` function to resolve return type conflicts.
  2. Re-creates the function with:
     - Atomic transaction logic (deduct balance, insert bet).
     - Proper return type (returns the created bet record).
     - Security hardening (search_path = public).
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Drop the existing function to allow return type changes
DROP FUNCTION IF EXISTS public.place_sports_bet(uuid, uuid, text, numeric, numeric, numeric);

-- 2. Re-create the function
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
    v_current_balance numeric;
    v_bet_id uuid;
    v_bet_record record;
BEGIN
    -- Check if stake is positive
    IF p_stake <= 0 THEN
        RAISE EXCEPTION 'Stake must be greater than 0';
    END IF;

    -- Check user balance (lock the row)
    SELECT credits INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_current_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct stake
    UPDATE public.wallets
    SET credits = credits - p_stake,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Create transaction record for the wager
    INSERT INTO public.transactions (
        user_id,
        type,
        amount_credits,
        created_at
    ) VALUES (
        p_user_id,
        'bet',
        -p_stake,
        now()
    );

    -- Insert the bet
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
    )
    RETURNING * INTO v_bet_record;

    -- Return the bet as JSON
    RETURN to_jsonb(v_bet_record);
END;
$$;
