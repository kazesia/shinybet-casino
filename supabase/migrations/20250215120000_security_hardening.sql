/*
  # Security Hardening & RLS
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: true
  
  ## Description:
  1. Enables Row Level Security (RLS) on all public tables.
  2. Defines access policies for Profiles, Wallets, Bets, and Transactions.
  3. Secures database functions by setting a fixed search_path.
  4. Ensures increment_balance is SECURITY DEFINER to allow wallet updates via RPC only.
*/

-- 1. Secure Functions (Fixes 'Function Search Path Mutable')
ALTER FUNCTION public.create_user_profile SET search_path = public;
ALTER FUNCTION public.get_user_stats SET search_path = public;
ALTER FUNCTION public.request_withdrawal SET search_path = public;

-- Ensure increment_balance is secure and exists (SECURITY DEFINER allows it to update wallets even if user direct update is blocked)
CREATE OR REPLACE FUNCTION public.increment_balance(p_user_id uuid, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.wallets
  SET credits = credits + p_amount
  WHERE user_id = p_user_id;
END;
$$;

-- 2. Enable RLS (Fixes 'RLS Disabled in Public')
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

-- 3. Define Policies

-- Profiles: Public read (for Leaderboards/Live Bets), Self update
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: Self read, No direct update (must use RPC increment_balance)
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Bets: Public read (Live feed), Self insert
CREATE POLICY "Bets are viewable by everyone" ON public.bets FOR SELECT USING (true);
CREATE POLICY "Users can insert own bets" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions: Self read, Self insert
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Deposits: Self read
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);

-- Withdrawals: Self read, Self insert
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can request withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Settings: Public read, Admin update
CREATE POLICY "Settings viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Deposit Addresses: Self read
CREATE POLICY "Users can view own deposit addresses" ON public.deposit_addresses FOR SELECT USING (auth.uid() = user_id);
