/*
  # Promote User to Super Admin
  
  ## Query Description:
  Promotes the specified user (UUID: 956edeea-3fe8-4b82-bfc9-e72fd808fa2f) to 'super_admin' role.
  This grants full access to the Admin Panel and Global Settings.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/

UPDATE public.profiles
SET role = 'super_admin'
WHERE id = '956edeea-3fe8-4b82-bfc9-e72fd808fa2f';

-- Optional: Verify the update was successful (for logging purposes if run manually)
-- SELECT id, username, role FROM public.profiles WHERE id = '956edeea-3fe8-4b82-bfc9-e72fd808fa2f';
