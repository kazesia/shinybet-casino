-- Migration: Fix return types and secure RPC functions
-- Description: Drops conflicting functions and recreates them with search_path=public for security.

BEGIN;

-- 1. Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.request_withdrawal(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.place_sports_bet(uuid, uuid, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, numeric);
DROP FUNCTION IF EXISTS public.admin_summary();

-- 2. Re-create increment_balance (Secure)
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
    
    RETURN v_new_balance;
END;
$$;

-- 3. Re-create place_sports_bet (Secure)
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
    WHERE user_id = p_user_id;

    IF v_balance IS NULL OR v_balance < p_stake THEN
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
        p_stake * p_odds,
        'pending'
    ) RETURNING id INTO v_bet_id;

    -- Log transaction
    INSERT INTO public.transactions (
        user_id,
        type,
        amount_credits
    ) VALUES (
        p_user_id,
        'bet',
        -p_stake
    );

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_balance - p_stake
    );
END;
$$;

-- 4. Re-create request_withdrawal (Secure)
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
    v_wd_id uuid;
BEGIN
    -- Check balance
    SELECT credits INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user_id;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct funds immediately
    UPDATE public.wallets
    SET credits = credits - p_amount
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
    ) RETURNING id INTO v_wd_id;

    -- Log transaction
    INSERT INTO public.transactions (
        user_id,
        type,
        amount_credits
    ) VALUES (
        p_user_id,
        'withdrawal',
        -p_amount
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_wd_id
    );
END;
$$;

-- 5. Re-create admin_summary (Secure)
CREATE OR REPLACE FUNCTION public.admin_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_users int;
    v_active_24h int;
    v_total_wagered numeric;
    v_total_deposits numeric;
    v_total_withdrawals numeric;
    v_net_profit numeric;
BEGIN
    SELECT count(*) INTO v_total_users FROM profiles;
    
    SELECT count(*) INTO v_active_24h 
    FROM profiles 
    WHERE last_sign_in_at > (now() - interval '24 hours');

    SELECT COALESCE(sum(stake_credits), 0) INTO v_total_wagered FROM bets;
    
    SELECT COALESCE(sum(amount_credits), 0) INTO v_total_deposits FROM deposits WHERE status = 'confirmed';
    
    SELECT COALESCE(sum(amount_credits), 0) INTO v_total_withdrawals FROM withdrawals WHERE status = 'paid';

    v_net_profit := v_total_deposits - v_total_withdrawals;

    RETURN jsonb_build_object(
        'total_users', v_total_users,
        'active_users_24h', v_active_24h,
        'total_wagered', v_total_wagered,
        'total_deposits', v_total_deposits,
        'total_withdrawals', v_total_withdrawals,
        'net_profit', v_net_profit,
        'house_edge_profit', v_total_wagered * 0.01
    );
END;
$$;

COMMIT;
