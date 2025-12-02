-- Fix for 42P13: Cannot change return type of existing function
-- We must DROP the functions first before recreating them with new signatures/security settings

-- 1. Drop existing functions (to avoid signature/return type conflicts)
DROP FUNCTION IF EXISTS public.request_withdrawal(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.place_sports_bet(uuid, uuid, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, numeric);

-- 2. Recreate request_withdrawal (Secured)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_user_id uuid,
    p_amount numeric,
    p_currency text,
    p_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_balance numeric;
    v_withdrawal_id uuid;
BEGIN
    -- Check balance
    SELECT credits INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Deduct balance
    UPDATE public.wallets
    SET credits = credits - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Create withdrawal record
    INSERT INTO public.withdrawals (user_id, amount_credits, currency, target_address, status)
    VALUES (p_user_id, p_amount, p_currency, p_address, 'pending')
    RETURNING id INTO v_withdrawal_id;

    -- Log transaction
    INSERT INTO public.transactions (user_id, type, amount_credits)
    VALUES (p_user_id, 'withdrawal', -p_amount);

    RETURN jsonb_build_object('id', v_withdrawal_id, 'status', 'pending');
END;
$$;

-- 3. Recreate place_sports_bet (Secured)
CREATE OR REPLACE FUNCTION public.place_sports_bet(
    p_user_id uuid,
    p_event_id uuid,
    p_selection_name text,
    p_odds numeric,
    p_stake numeric
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
    SELECT credits INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct stake
    UPDATE public.wallets
    SET credits = credits - p_stake,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Insert bet
    INSERT INTO public.sports_bets (user_id, event_id, selection_name, odds, stake, potential_payout, status)
    VALUES (p_user_id, p_event_id, p_selection_name, p_odds, p_stake, (p_stake * p_odds), 'pending')
    RETURNING id INTO v_bet_id;

    -- Log transaction
    INSERT INTO public.transactions (user_id, type, amount_credits)
    VALUES (p_user_id, 'bet', -p_stake);

    RETURN jsonb_build_object('id', v_bet_id, 'new_balance', (v_balance - p_stake));
END;
$$;

-- 4. Recreate increment_balance (Secured)
CREATE OR REPLACE FUNCTION public.increment_balance(
    p_user_id uuid,
    p_amount numeric
)
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

    -- Log transaction if amount is non-zero
    IF p_amount != 0 THEN
        INSERT INTO public.transactions (user_id, type, amount_credits)
        VALUES (p_user_id, CASE WHEN p_amount > 0 THEN 'payout' ELSE 'bet' END, p_amount);
    END IF;

    RETURN v_new_balance;
END;
$$;
