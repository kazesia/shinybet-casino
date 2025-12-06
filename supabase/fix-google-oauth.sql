-- EMERGENCY FIX: Google OAuth Profile Creation Error
-- Run this in Supabase SQL Editor to fix "Database error saving new user"

-- Step 1: Check what columns exist in profiles table
-- (This is for debugging, you can run this first to see the table structure)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';

-- Step 2: Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create a more defensive profile creation function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_username TEXT;
  new_referral_id TEXT;
BEGIN
  -- Generate username from metadata or fallback
  new_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User_' || substr(NEW.id::text, 1, 8)
  );
  
  -- Generate unique referral ID
  new_referral_id := encode(gen_random_bytes(6), 'hex');

  -- Insert profile with minimal required fields
  -- Using ON CONFLICT to prevent duplicate errors
  INSERT INTO public.profiles (id, username, email, role, banned, created_at)
  VALUES (
    NEW.id,
    new_username,
    NEW.email,
    'user',
    false,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(profiles.username, EXCLUDED.username);

  -- Try to set referral_id if column exists (won't error if column missing)
  BEGIN
    UPDATE public.profiles 
    SET referral_id = new_referral_id 
    WHERE id = NEW.id AND referral_id IS NULL;
  EXCEPTION WHEN undefined_column THEN
    -- Column doesn't exist, skip
    NULL;
  END;

  -- Create wallet for user
  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Profile creation error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Step 4: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.wallets TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 6: Create missing profiles for any existing auth users
INSERT INTO public.profiles (id, username, email, role, banned, created_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'username',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User_' || substr(au.id::text, 1, 8)
  ),
  au.email,
  'user',
  false,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create missing wallets for any existing profiles
INSERT INTO public.wallets (user_id, credits)
SELECT p.id, 0
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.wallets w WHERE w.user_id = p.id)
ON CONFLICT (user_id) DO NOTHING;

-- Step 8: Verify the setup
SELECT 'Trigger exists:' as check_type, 
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
       ) THEN 'YES' ELSE 'NO' END as result;

SELECT 'Profiles count:' as check_type, count(*)::text as result FROM profiles;
SELECT 'Wallets count:' as check_type, count(*)::text as result FROM wallets;
SELECT 'Auth users count:' as check_type, count(*)::text as result FROM auth.users;
