/*
  # Shiny.bet Schema Initialization
  
  ## Query Description:
  This migration sets up the core database structure for the casino application.
  It includes tables for profiles, wallets, bets, transactions, and payment processing.
  It also creates necessary triggers for user onboarding and RPCs for game logic.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tables: profiles, wallets, bets, transactions, deposit_addresses, deposits, withdrawals
  - Triggers: on_auth_user_created (auto-create profile/wallet)
  - RPCs: get_user_stats, request_withdrawal
  
  ## Security Implications:
  - RLS Enabled on all public tables
  - Policies restrict access to own data only
*/

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  credits NUMERIC DEFAULT 0,
  version INT DEFAULT 0,
  UNIQUE(user_id)
);

-- 3. Bets Table
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  stake_credits NUMERIC NOT NULL,
  payout_credits NUMERIC DEFAULT 0,
  result TEXT, -- 'win', 'loss', 'pending'
  raw_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'payout'
  amount_credits NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Deposit Addresses Table
CREATE TABLE IF NOT EXISTS public.deposit_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT NOT NULL,
  address TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- 6. Deposits Table
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT NOT NULL,
  amount_crypto NUMERIC NOT NULL,
  amount_credits NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT NOT NULL,
  amount_credits NUMERIC NOT NULL,
  target_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Policies
-- Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
CREATE POLICY "Users can view own bets" ON public.bets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;
CREATE POLICY "Users can insert own bets" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own addresses" ON public.deposit_addresses;
CREATE POLICY "Users can view own addresses" ON public.deposit_addresses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for Profile Creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 8)));
  
  INSERT INTO public.wallets (user_id, credits)
  VALUES (new.id, 1000); -- Giving 1000 demo credits
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RPC: Get User Stats
DROP FUNCTION IF EXISTS get_user_stats(UUID);
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  total_wagered NUMERIC;
  biggest_win NUMERIC;
  net_pl NUMERIC;
  total_won NUMERIC;
  total_lost NUMERIC;
BEGIN
  SELECT COALESCE(SUM(stake_credits), 0) INTO total_wagered FROM public.bets WHERE bets.user_id = get_user_stats.user_id;
  SELECT COALESCE(MAX(payout_credits), 0) INTO biggest_win FROM public.bets WHERE bets.user_id = get_user_stats.user_id AND result = 'win';
  
  SELECT COALESCE(SUM(payout_credits), 0) INTO total_won FROM public.bets WHERE bets.user_id = get_user_stats.user_id AND result = 'win';
  SELECT COALESCE(SUM(stake_credits), 0) INTO total_lost FROM public.bets WHERE bets.user_id = get_user_stats.user_id AND result = 'loss';
  
  net_pl := total_won - total_lost;
  
  RETURN json_build_object(
    'total_wagered', total_wagered,
    'biggest_win', biggest_win,
    'net_pl', net_pl
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Request Withdrawal
DROP FUNCTION IF EXISTS request_withdrawal(UUID, NUMERIC, TEXT, TEXT);
CREATE OR REPLACE FUNCTION request_withdrawal(p_user_id UUID, p_amount NUMERIC, p_currency TEXT, p_address TEXT)
RETURNS VOID AS $$
DECLARE
  current_bal NUMERIC;
BEGIN
  -- Check balance
  SELECT credits INTO current_bal FROM public.wallets WHERE user_id = p_user_id;
  
  IF current_bal < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- Deduct balance
  UPDATE public.wallets SET credits = credits - p_amount WHERE user_id = p_user_id;
  
  -- Create withdrawal record
  INSERT INTO public.withdrawals (user_id, currency, amount_credits, target_address, status)
  VALUES (p_user_id, p_currency, p_amount, p_address, 'pending');
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount_credits)
  VALUES (p_user_id, 'withdrawal', p_amount);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
