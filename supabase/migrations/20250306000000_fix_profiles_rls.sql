/*
  # Fix Infinite Recursion in Profiles RLS

  ## Query Description:
  This migration resolves the "infinite recursion" error by refactoring the Row Level Security (RLS) policies for the `profiles` table.
  It introduces a `security_definer` function `is_admin()` to safely check user roles without triggering RLS loops.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High" (Fixes critical bug)
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Functions: Adds `is_admin()`
  - Policies: Replaces all policies on `profiles` table
*/

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to bypass RLS when querying the profiles table
-- This breaks the recursion loop when policies check for admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

-- 2. Drop existing policies to start fresh and ensure no recursive logic remains
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can see their own profile" ON profiles;

-- 3. Create new, non-recursive policies

-- SELECT: Allow everyone to read profiles (Essential for Chat, Leaderboards, and Public Profiles)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

-- INSERT: Users can create their own profile (Matches auth.uid)
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update ONLY their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- UPDATE: Admins can update ANY profile (Uses the secure function to bypass recursion)
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (is_admin());

-- DELETE: Admins can delete ANY profile
CREATE POLICY "Admins can delete any profile"
ON profiles FOR DELETE
USING (is_admin());
