/*
  # Update User Balance
  
  ## Query Description:
  Updates the wallet balance (credits) for the user with email 'shinybetting@gma.com' to 1000.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Updates 'credits' column in 'public.wallets' table.
  - Joins with 'auth.users' to find the correct user_id.
*/

UPDATE public.wallets
SET credits = 1000
FROM auth.users
WHERE public.wallets.user_id = auth.users.id
AND auth.users.email = 'shinybetting@gma.com';
