-- Fix duplicate request_withdrawal function
-- This removes the DOUBLE PRECISION version and keeps only NUMERIC

-- Drop both versions
DROP FUNCTION IF EXISTS public.request_withdrawal(uuid, double precision, text, text);
DROP FUNCTION IF EXISTS public.request_withdrawal(uuid, numeric, text, text);

-- Recreate with NUMERIC only (standard PostgreSQL type)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_user_id UUID,
    p_amount NUMERIC,
    p_currency TEXT,
    p_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wallet_id UUID;
    v_current_balance NUMERIC;
    v_withdrawal_id UUID;
BEGIN
    -- Get wallet
    SELECT id, credits INTO v_wallet_id, v_current_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF v_wallet_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;

    -- Check balance
    IF v_current_balance < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- Deduct from wallet
    UPDATE wallets
    SET credits = credits - p_amount
    WHERE id = v_wallet_id;

    -- Create withdrawal request
    INSERT INTO withdrawals (user_id, amount_credits, currency, target_address, status)
    VALUES (p_user_id, p_amount, p_currency, p_address, 'pending')
    RETURNING id INTO v_withdrawal_id;

    -- Create transaction record
    INSERT INTO transactions (user_id, type, amount_credits, meta)
    VALUES (p_user_id, 'withdrawal', -p_amount, jsonb_build_object(
        'withdrawal_id', v_withdrawal_id,
        'currency', p_currency,
        'address', p_address
    ));

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.request_withdrawal(UUID, NUMERIC, TEXT, TEXT) TO authenticated;
