/*
  # Fix Missing RPC Functions
  
  ## Query Description:
  This migration adds critical RPC functions required for game logic and wallet operations.
  1. `increment_balance`: Updates user wallet balance (handles both wins and losses).
  2. `request_withdrawal`: Handles withdrawal requests transactionally (deducts balance + creates record).
  
  ## Metadata:
  - Schema-Category: "Logic"
  - Impact-Level: "High" (Required for core functionality)
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - Functions are SECURITY DEFINER to allow controlled access to tables.
  - Search path is set to public to prevent hijacking.
*/

-- Function to safely increment/decrement user balance
CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount DOUBLE PRECISION)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the wallet balance
  UPDATE wallets
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Optional: You could add a check here to ensure balance doesn't go negative
  -- IF (SELECT credits FROM wallets WHERE user_id = p_user_id) < 0 THEN ...
END;
$$;

-- Function to handle withdrawal requests transactionally
CREATE OR REPLACE FUNCTION request_withdrawal(p_user_id UUID, p_amount DOUBLE PRECISION, p_currency TEXT, p_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance DOUBLE PRECISION;
BEGIN
  -- Lock the wallet row for update to prevent race conditions
  SELECT credits INTO v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
  
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  -- Deduct funds
  UPDATE wallets 
  SET credits = credits - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Create withdrawal record
  INSERT INTO withdrawals (user_id, amount_credits, currency, target_address, status)
  VALUES (p_user_id, p_amount, p_currency, p_address, 'pending');
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_balance(UUID, DOUBLE PRECISION) TO authenticated;
GRANT EXECUTE ON FUNCTION request_withdrawal(UUID, DOUBLE PRECISION, TEXT, TEXT) TO authenticated;
