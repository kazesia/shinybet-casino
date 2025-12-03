/*
  # Vault System & Security Hardening
  
  1. New Tables:
    - `vaults`: Stores separate balance for users.
  
  2. New Functions:
    - `vault_transfer`: Handles atomic transfers between wallet and vault.
    
  3. Security Fixes:
    - Updates existing RPCs to set explicit `search_path` (Addressing Security Advisory).
*/

-- 1. Create Vaults Table
CREATE TABLE IF NOT EXISTS public.vaults (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(20, 8) DEFAULT 0 CHECK (amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own vault" 
  ON public.vaults FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Vault Transfer Function
CREATE OR REPLACE FUNCTION public.vault_transfer(p_amount NUMERIC, p_direction TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_current_vault NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Ensure vault record exists
  INSERT INTO public.vaults (user_id, amount) 
  VALUES (v_user_id, 0) 
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Lock rows for atomic update
  SELECT credits INTO v_current_balance FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
  SELECT amount INTO v_current_vault FROM public.vaults WHERE user_id = v_user_id FOR UPDATE;

  IF p_direction = 'deposit' THEN
    -- Wallet -> Vault
    IF v_current_balance < p_amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
    
    UPDATE public.wallets SET credits = credits - p_amount, version = version + 1 WHERE user_id = v_user_id;
    UPDATE public.vaults SET amount = amount + p_amount, updated_at = NOW() WHERE user_id = v_user_id;
    
  ELSIF p_direction = 'withdraw' THEN
    -- Vault -> Wallet
    IF v_current_vault < p_amount THEN
      RAISE EXCEPTION 'Insufficient vault balance';
    END IF;
    
    UPDATE public.vaults SET amount = amount - p_amount, updated_at = NOW() WHERE user_id = v_user_id;
    UPDATE public.wallets SET credits = credits + p_amount, version = version + 1 WHERE user_id = v_user_id;
    
  ELSE
    RAISE EXCEPTION 'Invalid direction. Use "deposit" or "withdraw".';
  END IF;

  -- Return new vault balance
  SELECT amount INTO v_current_vault FROM public.vaults WHERE user_id = v_user_id;
  RETURN v_current_vault;
END;
$$;

-- 3. Security Hardening: Fix Search Path on Critical Functions
-- This prevents search_path hijacking attacks

CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
  SET credits = credits + p_amount,
      version = version + 1
  WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_stats(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_wagered NUMERIC;
  total_wins NUMERIC;
  total_losses NUMERIC;
  net_profit NUMERIC;
  total_deposits NUMERIC;
  total_withdrawals NUMERIC;
  total_payout NUMERIC;
BEGIN
  -- Calculate betting stats
  SELECT 
    COALESCE(SUM(stake_credits), 0),
    COALESCE(SUM(payout_credits), 0)
  INTO 
    total_wagered,
    total_payout
  FROM public.bets 
  WHERE bets.user_id = get_user_stats.user_id;

  net_profit := total_payout - total_wagered;

  -- Calculate transaction stats
  SELECT COALESCE(SUM(amount_credits), 0) INTO total_deposits
  FROM public.deposits 
  WHERE deposits.user_id = get_user_stats.user_id AND status = 'confirmed';

  SELECT COALESCE(SUM(amount_credits), 0) INTO total_withdrawals
  FROM public.withdrawals 
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

CREATE OR REPLACE FUNCTION public.get_user_seeds(p_user_id UUID)
RETURNS TABLE (
  client_seed TEXT,
  server_seed_hash TEXT,
  nonce INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure seeds exist
  IF NOT EXISTS (SELECT 1 FROM public.user_seeds WHERE user_id = p_user_id) THEN
    INSERT INTO public.user_seeds (user_id, client_seed, server_seed, server_seed_hash, nonce)
    VALUES (
      p_user_id,
      encode(gen_random_bytes(16), 'hex'),
      encode(gen_random_bytes(32), 'hex'),
      encode(digest(encode(gen_random_bytes(32), 'hex'), 'sha256'), 'hex'),
      0
    );
  END IF;

  RETURN QUERY
  SELECT 
    us.client_seed,
    us.server_seed_hash,
    us.nonce,
    us.created_at
  FROM public.user_seeds us
  WHERE us.user_id = p_user_id;
END;
$$;
