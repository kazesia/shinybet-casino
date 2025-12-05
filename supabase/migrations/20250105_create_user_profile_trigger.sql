-- Update User Profile Creation Trigger to Support Affiliate System
-- This migration updates the create_user_profile function to include referral tracking

-- Drop and recreate the function with affiliate fields
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile with affiliate fields
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    role, 
    banned,
    referral_id,
    referred_by_user_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    'user',
    false,
    encode(gen_random_bytes(6), 'hex'), -- Generate unique referral ID
    (NEW.raw_user_meta_data->>'referred_by_user_id')::uuid -- Get from signup metadata
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet for user
  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (it should from previous migration, but this is idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();
