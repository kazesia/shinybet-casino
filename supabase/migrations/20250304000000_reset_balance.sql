/*
  # Reset User Balance
  Resets the wallet balance for shinybetting@gma.com to 1000 credits.

  ## Query Description:
  Updates the 'credits' column in the 'wallets' table for the user with the specified email.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true (by manually setting balance back)
  
  ## Structure Details:
  - Table: wallets
  - Column: credits
*/

UPDATE wallets
SET credits = 1000
FROM auth.users
WHERE wallets.user_id = auth.users.id
AND auth.users.email = 'shinybetting@gma.com';
