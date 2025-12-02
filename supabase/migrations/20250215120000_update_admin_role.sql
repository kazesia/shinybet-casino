/*
  # Update Admin Role
  Updates the profile for 'shinybetting@gmail.com' to have the 'admin' role.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

UPDATE profiles
SET role = 'admin'
WHERE email = 'shinybetting@gmail.com';
