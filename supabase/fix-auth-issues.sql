-- FIX AUTHENTICATION ISSUES - Run this in Supabase SQL Editor
-- This script fixes profile creation trigger and creates missing profiles/wallets

-- ===== STEP 1: Fix the profile creation trigger =====

-- Create or replace the function to create profiles on signup
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
    referred_by_user_id,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    'user',
    false,
    encode(gen_random_bytes(6), 'hex'),
    (NEW.raw_user_meta_data->>'referred_by_user_id')::uuid,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet for user
  INSERT INTO public.wallets (user_id, credits, version, updated_at)
  VALUES (NEW.id, 0, 1, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();


-- ===== STEP 2: Fix RLS policies =====

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read profiles (for chat, leaderboards, etc.)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);


-- ===== STEP 3: Fix wallets RLS =====

DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can insert own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own wallet
CREATE POLICY "Users can view own wallet" 
ON wallets FOR SELECT 
USING (auth.uid() = user_id);

-- System can insert wallets (via service key or trigger)
CREATE POLICY "Users can insert own wallet" 
ON wallets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own wallet
CREATE POLICY "Users can update own wallet" 
ON wallets FOR UPDATE 
USING (auth.uid() = user_id);


-- ===== STEP 4: Create missing profiles for existing users =====

INSERT INTO public.profiles (id, username, email, role, banned, referral_id, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'username', 'User_' || substr(id::text, 1, 8)),
  email,
  'user',
  false,
  encode(gen_random_bytes(6), 'hex'),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;


-- ===== STEP 5: Create missing wallets for existing users =====

INSERT INTO public.wallets (user_id, credits, version, updated_at)
SELECT id, 0, 1, NOW()
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallets)
ON CONFLICT (user_id) DO NOTHING;


-- ===== STEP 6: Fix chat_messages RLS =====

DROP POLICY IF EXISTS "Anyone can read messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can read chat
CREATE POLICY "Anyone can read messages" 
ON chat_messages FOR SELECT 
USING (true);

-- Authenticated users can send messages
CREATE POLICY "Authenticated users can send messages" 
ON chat_messages FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages" 
ON chat_messages FOR DELETE 
USING (auth.uid() = user_id);


-- ===== STEP 7: Fix bets RLS =====

DROP POLICY IF EXISTS "Users can view all bets" ON bets;
DROP POLICY IF EXISTS "Authenticated users can place bets" ON bets;

ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Anyone can view bets (for live feed)
CREATE POLICY "Users can view all bets" 
ON bets FOR SELECT 
USING (true);

-- Authenticated users can place bets
CREATE POLICY "Authenticated users can place bets" 
ON bets FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);


-- ===== VERIFICATION: Check results =====

SELECT 'Profiles count: ' || count(*)::text FROM profiles;
SELECT 'Wallets count: ' || count(*)::text FROM wallets;
SELECT 'Auth users count: ' || count(*)::text FROM auth.users;

