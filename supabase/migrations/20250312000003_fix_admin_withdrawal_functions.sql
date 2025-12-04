-- Fix admin_approve_withdrawal and admin_reject_withdrawal functions
-- to match actual withdrawals table schema

DROP FUNCTION IF EXISTS admin_approve_withdrawal(uuid, text);
DROP FUNCTION IF EXISTS admin_reject_withdrawal(uuid, text);

-- Recreate admin_approve_withdrawal (without updated_at and tx_hash columns)
CREATE OR REPLACE FUNCTION admin_approve_withdrawal(p_withdrawal_id uuid, p_tx_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update withdrawal status to 'paid' (withdrawals table only has: id, user_id, currency, amount_credits, target_address, status, created_at)
    UPDATE withdrawals
    SET status = 'paid'
    WHERE id = p_withdrawal_id;
END;
$$;

-- Recreate admin_reject_withdrawal (refund credits to user)
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
    WHERE id = p_withdrawal_id;

    -- Update withdrawal status
    UPDATE withdrawals
    SET status = 'rejected'
    WHERE id = p_withdrawal_id;

    -- Refund credits to user's wallet
    UPDATE wallets
    SET credits = credits + v_amount
    WHERE user_id = v_user_id;

    -- Create transaction record for refund
    INSERT INTO transactions (user_id, type, amount_credits)
    VALUES (v_user_id, 'refund', v_amount);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION admin_approve_withdrawal(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_withdrawal(UUID, TEXT) TO authenticated;
