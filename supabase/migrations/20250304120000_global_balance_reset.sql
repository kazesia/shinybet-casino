/*
  # Global Balance Reset & Default Update
  
  ## Query Description:
  1. Resets ALL existing user wallet balances to 1000 credits.
  2. Updates the default value for the 'credits' column to 1000, ensuring new users start with this amount.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Medium" (Resets user balances)
  - Requires-Backup: false
  - Reversible: false (Old balances are overwritten)
  
  ## Structure Details:
  - Table: wallets
  - Column: credits
*/

-- 1. Reset all existing wallets to 1000
UPDATE public.wallets 
SET credits = 1000;

-- 2. Set default value for new rows
ALTER TABLE public.wallets 
ALTER COLUMN credits SET DEFAULT 1000;

-- 3. Attempt to update the handle_new_user function if it hardcodes the balance
-- This is a safety measure in case the trigger explicitly inserts 0 instead of using the default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 8)),
    new.email,
    'user'
  );

  INSERT INTO public.wallets (user_id, credits)
  VALUES (new.id, 1000); -- Explicitly set to 1000

  RETURN new;
END;
$$;
