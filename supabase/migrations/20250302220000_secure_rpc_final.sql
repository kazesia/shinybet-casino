-- Secure all RPC functions by explicitly setting search_path
-- This resolves the "Function Search Path Mutable" security advisories

-- 1. Secure place_sports_bet
CREATE OR REPLACE FUNCTION public.place_sports_bet(
    p_user_id uuid,
    p_event_id uuid,
    p_selection_name text,
    p_odds numeric,
    p_stake numeric,
    p_potential_payout numeric DEFAULT NULL -- Optional, calculated if null
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_balance numeric;
    v_bet_id uuid;
    v_final_payout numeric;
BEGIN
    -- Calculate payout if not provided
    IF p_potential_payout IS NULL THEN
        v_final_payout := p_stake * p_odds;
    ELSE
        v_final_payout := p_potential_payout;
    END IF;

    -- Check Balance
    SELECT credits INTO v_user_balance FROM public.wallets WHERE user_id = p_user_id;
    
    IF v_user_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct Stake
    UPDATE public.wallets 
    SET credits = credits - p_stake, 
        version = version + 1,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- Insert Bet
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
        v_final_payout,
        'pending'
    ) RETURNING id INTO v_bet_id;

    -- Log Transaction
    INSERT INTO public.transactions (
        user_id,
        type,
        amount_credits,
        balance_after
    ) VALUES (
        p_user_id,
        'bet',
        -p_stake,
        v_user_balance - p_stake
    );

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_user_balance - p_stake
    );
END;
$$;

-- 2. Secure increment_balance
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
        version = version + 1,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING credits INTO v_new_balance;

    RETURN v_new_balance;
END;
$$;

-- 3. Secure request_withdrawal
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
BEGIN
    -- Check balance
    SELECT credits INTO v_balance FROM public.wallets WHERE user_id = p_user_id;
    
    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct funds immediately
    UPDATE public.wallets 
    SET credits = credits - p_amount,
        version = version + 1
    WHERE user_id = p_user_id;

    -- Create withdrawal record
    INSERT INTO public.withdrawals (
        user_id,
        amount_credits,
        currency,
        target_address,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_currency,
        p_address,
        'pending'
    );

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 4. Secure Admin Functions (if they exist)
-- We wrap these in DO blocks to avoid errors if the functions don't exist yet

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_summary') THEN
        ALTER FUNCTION public.admin_summary() SET search_path = public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_toggle_ban') THEN
        ALTER FUNCTION public.admin_toggle_ban(uuid, boolean) SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_change_role') THEN
        ALTER FUNCTION public.admin_change_role(uuid, text) SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_approve_withdrawal') THEN
        ALTER FUNCTION public.admin_approve_withdrawal(uuid, text) SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_reject_withdrawal') THEN
        ALTER FUNCTION public.admin_reject_withdrawal(uuid, text) SET search_path = public;
    END IF;
END $$;
