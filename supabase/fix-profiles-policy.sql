-- Fix infinite recursion in profiles table RLS policies
-- This script drops problematic policies and creates new ones that avoid recursion

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create new policies that use auth.uid() directly to avoid recursion
-- This prevents the policy from querying the profiles table while evaluating access

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Optional: Allow users to view all profiles (for leaderboards, etc.)
-- Uncomment if you want public profile viewing
-- CREATE POLICY "Public profiles are viewable by everyone"
-- ON profiles FOR SELECT
-- USING (true);
