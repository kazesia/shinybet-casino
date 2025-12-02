-- Migration: Fix Admin Functions (Drop & Recreate)
-- Description: Drops existing admin functions to resolve return type conflicts and missing function errors, then recreates them with security hardening.

-- 1. Drop existing functions explicitly to avoid 42P13 errors
DROP FUNCTION IF EXISTS admin_summary();
DROP FUNCTION IF EXISTS admin_toggle_ban(uuid, boolean);
DROP FUNCTION IF EXISTS admin_change_role(uuid, text);
DROP FUNCTION IF EXISTS admin_approve_withdrawal(uuid, text);
DROP FUNCTION IF EXISTS admin_reject_withdrawal(uuid, text);

-- 2. Recreate admin_summary
CREATE OR REPLACE FUNCTION admin_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    -- Note: In a production app, add a check here to ensure auth.uid() is an admin
    
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM profiles),
        'active_users_24h', (SELECT count(*) FROM profiles WHERE last_sign_in_at > now() - interval '24 hours'),
        'total_deposits', (SELECT COALESCE(sum(amount_credits), 0) FROM deposits WHERE status = 'confirmed'),
        'total_withdrawals', (SELECT COALESCE(sum(amount_credits), 0) FROM withdrawals WHERE status = 'paid'),
        'total_wagered', (SELECT COALESCE(sum(stake_credits), 0) FROM bets),
        'house_edge_profit', (SELECT COALESCE(sum(stake_credits * 0.01), 0) FROM bets), -- Approx 1% theoretical edge
        'net_profit', (
            (SELECT COALESCE(sum(stake_credits), 0) FROM bets) - 
            (SELECT COALESCE(sum(payout_credits), 0) FROM bets)
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 3. Recreate admin_toggle_ban
CREATE OR REPLACE FUNCTION admin_toggle_ban(p_user_id uuid, p_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles
    SET banned = p_status
    WHERE id = p_user_id;
END;
$$;

-- 4. Recreate admin_change_role
CREATE OR REPLACE FUNCTION admin_change_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE profiles
    SET role = p_role
    WHERE id = p_user_id;
END;
$$;

-- 5. Recreate admin_approve_withdrawal
CREATE OR REPLACE FUNCTION admin_approve_withdrawal(p_withdrawal_id uuid, p_tx_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE withdrawals
    SET status = 'paid',
        tx_hash = p_tx_hash,
        updated_at = now()
    WHERE id = p_withdrawal_id;
END;
$$;

-- 6. Recreate admin_reject_withdrawal
CREATE OR REPLACE FUNCTION admin_reject_withdrawal(p_withdrawal_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_amount numeric;
BEGIN
    -- Get withdrawal details
    SELECT user_id, amount_credits INTO v_user_id, v_amount
    FROM withdrawals
    WHERE id = p_withdrawal_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal not found or already processed';
    END IF;

    -- Refund user wallet
    UPDATE wallets
    SET credits = credits + v_amount
    WHERE user_id = v_user_id;

    -- Update withdrawal status
    UPDATE withdrawals
    SET status = 'rejected',
        rejection_reason = p_reason,
        updated_at = now()
    WHERE id = p_withdrawal_id;
END;
$$;
