-- Affiliate System Migration (Fixed for Supabase)
-- This assumes you're using a profiles/users table in the public schema

-- First, check if you have a users/profiles table. 
-- If you're using auth.users only, you'll need a profiles table to store additional user data.

-- Create profiles table if it doesn't exist (skip if you already have users/profiles table)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  balance DECIMAL(20, 8) DEFAULT 0,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add referral columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referral_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES public.profiles(id);

-- Generate unique referral_id for existing users
UPDATE public.profiles 
SET referral_id = encode(gen_random_bytes(6), 'hex') 
WHERE referral_id IS NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_id ON public.profiles(referral_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by_user_id);

-- Create affiliate_earnings table
CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  currency TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  source_type TEXT NOT NULL, -- 'casino', 'sportsbook', 'poker'
  source_id UUID, -- reference to bet/game id
  commission_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.10,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for affiliate_earnings
CREATE INDEX IF NOT EXISTS idx_affiliate_user_id ON public.affiliate_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referred_user ON public.affiliate_earnings(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_currency ON public.affiliate_earnings(currency);
CREATE INDEX IF NOT EXISTS idx_affiliate_calculated_at ON public.affiliate_earnings(calculated_at);

-- Create affiliate_commission_transfers table
CREATE TABLE IF NOT EXISTS public.affiliate_commission_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(20, 8) NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for affiliate_commission_transfers
CREATE INDEX IF NOT EXISTS idx_transfer_user_id ON public.affiliate_commission_transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_status ON public.affiliate_commission_transfers(status);
CREATE INDEX IF NOT EXISTS idx_transfer_transferred_at ON public.affiliate_commission_transfers(transferred_at);

-- Create affiliate_campaigns table
CREATE TABLE IF NOT EXISTS public.affiliate_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  referral_code TEXT UNIQUE,
  commission_rate DECIMAL(5, 4) DEFAULT 0.10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for affiliate_campaigns
CREATE INDEX IF NOT EXISTS idx_campaign_user_id ON public.affiliate_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_referral_code ON public.affiliate_campaigns(referral_code);

-- Enable Row Level Security
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commission_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own affiliate earnings" ON public.affiliate_earnings;
DROP POLICY IF EXISTS "Users view own transfers" ON public.affiliate_commission_transfers;
DROP POLICY IF EXISTS "Users create own transfers" ON public.affiliate_commission_transfers;
DROP POLICY IF EXISTS "Users view own campaigns" ON public.affiliate_campaigns;
DROP POLICY IF EXISTS "Users manage own campaigns" ON public.affiliate_campaigns;
DROP POLICY IF EXISTS "Admins full access earnings" ON public.affiliate_earnings;
DROP POLICY IF EXISTS "Admins full access transfers" ON public.affiliate_commission_transfers;
DROP POLICY IF EXISTS "Admins full access campaigns" ON public.affiliate_campaigns;

-- RLS Policies for affiliate_earnings
CREATE POLICY "Users view own affiliate earnings" ON public.affiliate_earnings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins full access earnings" ON public.affiliate_earnings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- RLS Policies for affiliate_commission_transfers
CREATE POLICY "Users view own transfers" ON public.affiliate_commission_transfers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own transfers" ON public.affiliate_commission_transfers
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins full access transfers" ON public.affiliate_commission_transfers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );

-- RLS Policies for affiliate_campaigns
CREATE POLICY "Users view own campaigns" ON public.affiliate_campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own campaigns" ON public.affiliate_campaigns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins full access campaigns" ON public.affiliate_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
  );
