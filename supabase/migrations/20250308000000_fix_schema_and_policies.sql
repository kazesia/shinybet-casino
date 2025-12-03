-- 1. Fix Wallets Table (Missing Column)
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Fix Profiles Infinite Recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create non-recursive policies
-- Allow read access to everyone (needed for chat, leaderboards, etc.)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to insert their own profile (usually handled by trigger, but good for safety)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update ONLY their own profile
-- This avoids querying the table to check for admin status, breaking recursion
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Ensure Vaults Table exists (if not created by previous migration)
CREATE TABLE IF NOT EXISTS public.vaults (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount NUMERIC(20, 8) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_vault UNIQUE (user_id)
);

-- Enable RLS on Vaults
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own vault" ON public.vaults;
CREATE POLICY "Users can view own vault" ON public.vaults FOR SELECT USING (auth.uid() = user_id);
