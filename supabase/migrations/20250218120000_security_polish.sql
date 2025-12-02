/*
  # Security Hardening & Logic Polish

  ## Query Description:
  1. Fixes "Search Path Mutable" warnings for all RPCs.
  2. Creates/Updates `increment_balance` for robust game state management.
  3. Ensures `shinybetting@gmail.com` has admin privileges.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - Sets `search_path = public` on all functions to prevent schema hijacking.
*/

-- 1. Secure existing functions by setting search_path
ALTER FUNCTION public.create_user_profile() SET search_path = public;
ALTER FUNCTION public.get_user_stats(uuid) SET search_path = public;
ALTER FUNCTION public.request_withdrawal(uuid, numeric, text, text) SET search_path = public;

-- 2. Secure Admin functions (if they exist from previous steps)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_approve_withdrawal') THEN
        ALTER FUNCTION public.admin_approve_withdrawal(uuid, text) SET search_path = public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_reject_withdrawal') THEN
        ALTER FUNCTION public.admin_reject_withdrawal(uuid, text) SET search_path = public;
    END IF;
END $$;

-- 3. Create/Update increment_balance (Critical for Dice Game)
-- This ensures the game can update balances atomically on the server side
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
  SET credits = credits + p_amount
  WHERE user_id = p_user_id;
END;
$$;

-- 4. Grant Admin Role (Idempotent check)
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'shinybetting@gmail.com';
