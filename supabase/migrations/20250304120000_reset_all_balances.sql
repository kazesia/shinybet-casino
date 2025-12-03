/*
  # Reset All Balances & Set Default
  
  ## Query Description: 
  1. Updates ALL existing wallets to have exactly 1000 credits.
  2. Sets the default value for the 'credits' column to 1000 for future users.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "High" (Modifies all user balances)
  - Requires-Backup: false
  - Reversible: true (via backup or manual update)
  
  ## Structure Details:
  - Table: public.wallets
  - Column: credits
*/

-- Update all existing wallets
UPDATE public.wallets 
SET credits = 1000;

-- Set default for new rows
ALTER TABLE public.wallets 
ALTER COLUMN credits SET DEFAULT 1000;
