/*
  # Reset All Balances to $1000

  ## Query Description:
  1. Updates all existing records in the `wallets` table, setting `credits` to 1000.00.
  2. Alters the `wallets` table to set the default value of `credits` to 1000.00 for all new users.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "High" (Resets all user balances)
  - Requires-Backup: true
  - Reversible: false (Old balances are overwritten)

  ## Structure Details:
  - Table: public.wallets
  - Column: credits
*/

-- Update all existing wallets to 1000 credits
UPDATE public.wallets
SET credits = 1000.00;

-- Set default value for new wallets to 1000
ALTER TABLE public.wallets
ALTER COLUMN credits SET DEFAULT 1000.00;
