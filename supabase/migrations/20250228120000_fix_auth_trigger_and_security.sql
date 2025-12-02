/*
  # Fix Auth Trigger and Enable Security

  ## Query Description: 
  This migration fixes the missing 'create_user_profile' function error by redefining it with proper security contexts. 
  It also enables Row Level Security (RLS) on all public tables to address critical security advisories.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Functions: public.create_user_profile (Replaced)
  - Triggers: on_auth_user_created (Recreated)
  - Security: RLS enabled on all tables
*/

-- 1. Fix the User Creation Function
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, role, banned)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    'user',
    false
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Re-attach the Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 4. Create Basic Policies (if they don't exist)

-- Profiles: Everyone can read usernames, Users can update own
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: Users can only see their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Bets: Public can see bets (for Live Feed), Users can insert their own
DROP POLICY IF EXISTS "Bets are viewable by everyone" ON public.bets;
CREATE POLICY "Bets are viewable by everyone" ON public.bets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;
CREATE POLICY "Users can insert own bets" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin Access Policies (Simplified for now)
-- Grant admins access to everything (using a subquery to check role)
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can do everything on profiles" ON public.profiles TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);
