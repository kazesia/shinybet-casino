-- Update specific user to super_admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE id = '956edeea-3fe8-4b82-bfc9-e72fd808fa2f';
