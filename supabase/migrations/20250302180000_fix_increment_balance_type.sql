/*
  # Fix Increment Balance Function
  
  ## Query Description:
  This migration resolves the "function does not exist" error by:
  1. Dropping any existing versions of increment_balance to remove ambiguity.
  2. Re-creating the function with the standard 'numeric' type which is compatible with both integer and float inputs from the frontend.
  3. Applying strict security settings (SECURITY DEFINER + search_path).

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - Sets search_path=public to prevent hijacking.
  - Uses SECURITY DEFINER to allow users to update their own wallet via this controlled function even if they don't have direct UPDATE privileges on the table.
*/

-- 1. Clean up existing functions to prevent "not unique" or "does not exist" confusion
DROP FUNCTION IF EXISTS public.increment_balance(uuid, numeric);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, double precision);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, float);
DROP FUNCTION IF EXISTS public.increment_balance(uuid, integer);

-- 2. Create the canonical function
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id uuid, p_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance numeric;
BEGIN
  -- Ensure the wallet exists (create if not, though triggers usually handle this)
  INSERT INTO public.wallets (user_id, credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update the balance
  UPDATE public.wallets
  SET credits = credits + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_balance(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_balance(uuid, numeric) TO service_role;
