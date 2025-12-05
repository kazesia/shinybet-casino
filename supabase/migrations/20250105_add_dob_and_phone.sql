-- Add Date of Birth and Phone to Profiles Table

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for phone lookups (if needed for verification)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Update the profile creation trigger to include new fields
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Create profile with all fields
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    role, 
    banned,
    referral_id,
    referred_by_user_id,
    date_of_birth,
    phone
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    'user',
    false,
    encode(gen_random_bytes(6), 'hex'),
    (NEW.raw_user_meta_data->>'referred_by_user_id')::uuid,
    (NEW.raw_user_meta_data->>'date_of_birth')::date,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet
  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$;
