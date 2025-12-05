-- Complete Profile Table and Trigger Fix for Affiliate System
-- Run this migration to fix user registration

-- 1. Add affiliate columns to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.profiles(id);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_referral_id ON public.profiles(referral_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by_user_id);

-- 3. Update existing users to have referral IDs
UPDATE public.profiles 
SET referral_id = encode(gen_random_bytes(6), 'hex') 
WHERE referral_id IS NULL;

-- 4. Update the profile creation trigger
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile with all fields including affiliate tracking
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
    encode(gen_random_bytes(6), 'hex'),
    (NEW.raw_user_meta_data->>'referred_by_user_id')::uuid
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet
  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 5. Ensure trigger is attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();
