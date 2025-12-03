-- Fix infinite recursion in profiles RLS policies
-- The issue arises when a policy on 'profiles' queries 'profiles' to check for admin roles

BEGIN;

-- 1. Drop existing policies on profiles to ensure a clean slate
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "View profiles" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;

-- 2. Enable RLS (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create Non-Recursive Policies

-- READ: Allow everyone to read profiles (Needed for leaderboards, chat, bets feed)
-- This avoids the need to check "Am I an admin?" inside the read policy.
CREATE POLICY "Everyone can view profiles" 
ON profiles FOR SELECT 
USING (true);

-- UPDATE: Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- INSERT: Users can insert their own profile (usually handled by trigger, but good to have)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- NOTE: For Admin powers, we rely on the fact that Supabase Service Role (used in Edge Functions) 
-- bypasses RLS. If UI-based admin edits are needed, we should use a SECURITY DEFINER function 
-- or a separate 'admins' table to avoid the self-referencing recursion on 'profiles'.

COMMIT;
