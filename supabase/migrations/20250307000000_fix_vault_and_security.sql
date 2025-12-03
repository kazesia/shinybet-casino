/*
  # Fix Increment Balance and Setup Vaults
  
  1. Fixes 'increment_balance' return type conflict by dropping it first.
  2. Ensures 'vaults' table exists.
  3. Sets up 'vault_transfer' secure function.
  4. Secures critical functions with search_path.
*/

-- 1. Fix increment_balance (Drop first to allow return type change)
DROP FUNCTION IF EXISTS increment_balance(uuid, numeric);

CREATE OR REPLACE FUNCTION increment_balance(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  -- Update the wallet balance
  UPDATE wallets
  SET credits = credits + p_amount,
      version = version + 1,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- Handle case where wallet might not exist (though it should)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  RETURN v_new_balance;
END;
$$;

-- 2. Ensure Vaults Table Exists
CREATE TABLE IF NOT EXISTS vaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  amount numeric DEFAULT 0 CHECK (amount >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on vaults
ALTER TABLE vaults ENABLE ROW LEVEL SECURITY;

-- Policies for vaults (Drop first to avoid conflict if exists)
DROP POLICY IF EXISTS "Users can view own vault" ON vaults;
CREATE POLICY "Users can view own vault" ON vaults FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Vault Transfer Function
CREATE OR REPLACE FUNCTION vault_transfer(p_amount numeric, p_direction text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_wallet_bal numeric;
  v_vault_bal numeric;
BEGIN
  -- Check inputs
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Get current balances (locking rows)
  SELECT credits INTO v_wallet_bal FROM wallets WHERE user_id = v_user_id FOR UPDATE;
  
  -- Ensure vault exists
  INSERT INTO vaults (user_id) VALUES (v_user_id) ON CONFLICT (user_id) DO NOTHING;
  SELECT amount INTO v_vault_bal FROM vaults WHERE user_id = v_user_id FOR UPDATE;

  IF p_direction = 'deposit' THEN
    -- Wallet -> Vault
    IF v_wallet_bal < p_amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
    
    UPDATE wallets SET credits = credits - p_amount, updated_at = now() WHERE user_id = v_user_id;
    UPDATE vaults SET amount = amount + p_amount, updated_at = now() WHERE user_id = v_user_id;
    
    RETURN v_vault_bal + p_amount;
    
  ELSIF p_direction = 'withdraw' THEN
    -- Vault -> Wallet
    IF v_vault_bal < p_amount THEN
      RAISE EXCEPTION 'Insufficient vault balance';
    END IF;
    
    UPDATE vaults SET amount = amount - p_amount, updated_at = now() WHERE user_id = v_user_id;
    UPDATE wallets SET credits = credits + p_amount, updated_at = now() WHERE user_id = v_user_id;
    
    RETURN v_vault_bal - p_amount;
    
  ELSE
    RAISE EXCEPTION 'Invalid direction';
  END IF;
END;
$$;

-- 4. Secure other functions (Idempotent)
CREATE OR REPLACE FUNCTION get_user_stats(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_wagered numeric;
  total_wins numeric;
  total_losses numeric;
  net_profit numeric;
  total_deposits numeric;
  total_withdrawals numeric;
  total_payout numeric;
BEGIN
  -- Calculate betting stats
  SELECT 
    COALESCE(SUM(stake_credits), 0),
    COALESCE(SUM(payout_credits), 0)
  INTO total_wagered, total_payout
  FROM bets 
  WHERE bets.user_id = get_user_stats.user_id;

  net_profit := total_payout - total_wagered;

  -- Calculate transaction stats
  SELECT COALESCE(SUM(amount_credits), 0) INTO total_deposits 
  FROM deposits 
  WHERE deposits.user_id = get_user_stats.user_id AND status = 'confirmed';

  SELECT COALESCE(SUM(amount_credits), 0) INTO total_withdrawals 
  FROM withdrawals 
  WHERE withdrawals.user_id = get_user_stats.user_id AND status = 'paid';

  RETURN json_build_object(
    'total_wagered', total_wagered,
    'total_payout', total_payout,
    'net_profit', net_profit,
    'total_deposits', total_deposits,
    'total_withdrawals', total_withdrawals
  );
END;
$$;

CREATE OR REPLACE FUNCTION get_user_seeds(p_user_id uuid)
RETURNS TABLE (
  client_seed text,
  server_seed_hash text,
  nonce int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.client_seed,
    us.server_seed_hash,
    us.nonce
  FROM user_seeds us
  WHERE us.user_id = p_user_id;
END;
$$;
