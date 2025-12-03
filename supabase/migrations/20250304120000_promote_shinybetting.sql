/*
  # Promote User to Super Admin
  
  ## Query Description:
  Promotes 'shinybetting@gmail.com' to 'super_admin' role in the profiles table.
  This grants full access to the Admin Panel.
  
  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

UPDATE public.profiles
SET role = 'super_admin'
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email = 'shinybetting@gmail.com';
