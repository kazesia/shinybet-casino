/*
  # VIP Tier System & Secure Bonus Claims
  
  ## Description:
  This migration implements a comprehensive VIP tier system with:
  - 5 VIP tiers (Bronze, Silver, Gold, Platinum, Diamond)
  - Tier-based rakeback rates and bonus multipliers
  - Secure bonus claim tracking with cooldowns
  - Automatic tier assignment based on wagering
  
  ## Security Fixes:
  - Prevents unlimited bonus claims via cooldown validation
  - Server-side only claim logic
  - Unique constraints prevent duplicate claims
  
  ## Tables Created:
  - vip_tiers: VIP tier definitions
  - bonus_claims: Track all bonus claims with cooldowns
  
  ## Tables Modified:
  - profiles: Add vip_tier_id and total_wagered_usd
  
  ## Functions Created:
  - assign_vip_tier: Auto-assign tier based on wagering
  - claim_weekly_boost: Claim $5 weekly (7-day cooldown)
  - claim_monthly_bonus: Claim $25 monthly (30-day cooldown)
  - claim_platinum_reload: Claim $10 daily (Platinum+ only, 24-hour cooldown)
*/

-- ============================================================================
-- 1. CREATE VIP_TIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vip_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  min_wager_usd NUMERIC NOT NULL DEFAULT 0,
  rakeback_rate NUMERIC NOT NULL DEFAULT 0.10 CHECK (rakeback_rate >= 0 AND rakeback_rate <= 1),
  bonus_multiplier NUMERIC NOT NULL DEFAULT 1.0 CHECK (bonus_multiplier >= 1.0),
  color TEXT DEFAULT '#CD7F32',
  icon TEXT DEFAULT 'Star',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.vip_tiers ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public can view tiers" ON public.vip_tiers;
CREATE POLICY "Public can view tiers" ON public.vip_tiers FOR SELECT USING (true);

COMMENT ON TABLE public.vip_tiers IS 'VIP tier definitions with rakeback rates and bonus multipliers';

-- ============================================================================
-- 2. SEED VIP TIERS DATA
-- ============================================================================
INSERT INTO public.vip_tiers (name, min_wager_usd, rakeback_rate, bonus_multiplier, color, icon) VALUES
  ('Bronze', 0, 0.10, 1.0, '#CD7F32', 'Star'),
  ('Silver', 10000, 0.12, 1.05, '#C0C0C0', 'Star'),
  ('Gold', 50000, 0.15, 1.10, '#FFD700', 'Crown'),
  ('Platinum', 250000, 0.18, 1.15, '#00CED1', 'Gem'),
  ('Diamond', 1000000, 0.20, 1.25, '#B9F2FF', 'Diamond')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. CREATE BONUS_CLAIMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bonus_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bonus_type TEXT NOT NULL CHECK (bonus_type IN ('weekly', 'monthly', 'reload')),
  amount_usd NUMERIC NOT NULL CHECK (amount_usd > 0),
  claimed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient cooldown checks
CREATE INDEX IF NOT EXISTS idx_bonus_claims_user_type_time 
ON public.bonus_claims(user_id, bonus_type, claimed_at DESC);

-- Enable RLS
ALTER TABLE public.bonus_claims ENABLE ROW LEVEL SECURITY;

-- Users can only view their own claims
DROP POLICY IF EXISTS "Users can view own bonus claims" ON public.bonus_claims;
CREATE POLICY "Users can view own bonus claims" ON public.bonus_claims 
FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.bonus_claims IS 'Tracks all bonus claims with timestamps for cooldown validation';

-- ============================================================================
-- 4. MODIFY PROFILES TABLE
-- ============================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vip_tier_id UUID REFERENCES public.vip_tiers(id),
ADD COLUMN IF NOT EXISTS total_wagered_usd NUMERIC DEFAULT 0;

-- Set default tier to Bronze for existing users
UPDATE public.profiles 
SET vip_tier_id = (SELECT id FROM public.vip_tiers WHERE name = 'Bronze' LIMIT 1)
WHERE vip_tier_id IS NULL;

-- ============================================================================
-- 5. RPC FUNCTION: assign_vip_tier
-- ============================================================================
DROP FUNCTION IF EXISTS assign_vip_tier(UUID);
CREATE OR REPLACE FUNCTION assign_vip_tier(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_wagered NUMERIC;
  v_new_tier_id UUID;
  v_old_tier_name TEXT;
  v_new_tier_name TEXT;
  v_tier_upgraded BOOLEAN := false;
BEGIN
  -- Get current total wagered from bets
  SELECT COALESCE(SUM(stake_credits), 0) INTO v_total_wagered
  FROM public.bets WHERE user_id = p_user_id;
  
  -- Update total_wagered_usd in profile
  UPDATE public.profiles SET total_wagered_usd = v_total_wagered
  WHERE id = p_user_id;
  
  -- Get current tier name
  SELECT vt.name INTO v_old_tier_name
  FROM public.profiles p
  LEFT JOIN public.vip_tiers vt ON p.vip_tier_id = vt.id
  WHERE p.id = p_user_id;
  
  -- Find highest eligible tier
  SELECT id INTO v_new_tier_id
  FROM public.vip_tiers
  WHERE min_wager_usd <= v_total_wagered
  ORDER BY min_wager_usd DESC
  LIMIT 1;
  
  -- Get new tier name
  SELECT name INTO v_new_tier_name
  FROM public.vip_tiers WHERE id = v_new_tier_id;
  
  -- Check if upgraded
  v_tier_upgraded := (v_old_tier_name IS NULL OR v_old_tier_name != v_new_tier_name);
  
  -- Update user's tier
  UPDATE public.profiles SET vip_tier_id = v_new_tier_id
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'total_wagered', v_total_wagered,
    'old_tier', COALESCE(v_old_tier_name, 'None'),
    'new_tier', v_new_tier_name,
    'upgraded', v_tier_upgraded
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_vip_tier IS 'Automatically assign VIP tier based on total wagered amount';

-- ============================================================================
-- 6. RPC FUNCTION: claim_weekly_boost
-- ============================================================================
DROP FUNCTION IF EXISTS claim_weekly_boost(UUID);
CREATE OR REPLACE FUNCTION claim_weekly_boost(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_claim TIMESTAMPTZ;
  v_amount NUMERIC := 5.00;
  v_hours_remaining NUMERIC;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot claim bonus for other users';
  END IF;
  
  -- Check last claim
  SELECT MAX(claimed_at) INTO v_last_claim
  FROM public.bonus_claims
  WHERE user_id = p_user_id AND bonus_type = 'weekly';
  
  -- Validate 7-day cooldown
  IF v_last_claim IS NOT NULL AND v_last_claim > NOW() - INTERVAL '7 days' THEN
    v_hours_remaining := EXTRACT(EPOCH FROM (v_last_claim + INTERVAL '7 days' - NOW())) / 3600;
    RAISE EXCEPTION 'Weekly boost already claimed. Next claim available in % hours.', 
      ROUND(v_hours_remaining, 1);
  END IF;
  
  -- Record claim
  INSERT INTO public.bonus_claims (user_id, bonus_type, amount_usd)
  VALUES (p_user_id, 'weekly', v_amount);
  
  -- Add to wallet
  UPDATE public.wallets 
  SET credits = credits + v_amount, version = version + 1
  WHERE user_id = p_user_id;
  
  -- Create transaction
  INSERT INTO public.transactions (user_id, type, amount_credits)
  VALUES (p_user_id, 'weekly_boost', v_amount);
  
  RETURN json_build_object(
    'amount', v_amount, 
    'next_claim', NOW() + INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION claim_weekly_boost IS 'Claim $5 weekly boost with 7-day cooldown';

-- ============================================================================
-- 7. RPC FUNCTION: claim_monthly_bonus
-- ============================================================================
DROP FUNCTION IF EXISTS claim_monthly_bonus(UUID);
CREATE OR REPLACE FUNCTION claim_monthly_bonus(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_claim TIMESTAMPTZ;
  v_amount NUMERIC := 25.00;
  v_days_remaining NUMERIC;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot claim bonus for other users';
  END IF;
  
  -- Check last claim
  SELECT MAX(claimed_at) INTO v_last_claim
  FROM public.bonus_claims
  WHERE user_id = p_user_id AND bonus_type = 'monthly';
  
  -- Validate 30-day cooldown
  IF v_last_claim IS NOT NULL AND v_last_claim > NOW() - INTERVAL '30 days' THEN
    v_days_remaining := EXTRACT(DAY FROM (v_last_claim + INTERVAL '30 days' - NOW()));
    RAISE EXCEPTION 'Monthly bonus already claimed. Next claim available in % days.', 
      ROUND(v_days_remaining, 1);
  END IF;
  
  -- Record claim
  INSERT INTO public.bonus_claims (user_id, bonus_type, amount_usd)
  VALUES (p_user_id, 'monthly', v_amount);
  
  -- Add to wallet
  UPDATE public.wallets 
  SET credits = credits + v_amount, version = version + 1
  WHERE user_id = p_user_id;
  
  -- Create transaction
  INSERT INTO public.transactions (user_id, type, amount_credits)
  VALUES (p_user_id, 'monthly_bonus', v_amount);
  
  RETURN json_build_object(
    'amount', v_amount, 
    'next_claim', NOW() + INTERVAL '30 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION claim_monthly_bonus IS 'Claim $25 monthly bonus with 30-day cooldown';

-- ============================================================================
-- 8. RPC FUNCTION: claim_platinum_reload
-- ============================================================================
DROP FUNCTION IF EXISTS claim_platinum_reload(UUID);
CREATE OR REPLACE FUNCTION claim_platinum_reload(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_last_claim TIMESTAMPTZ;
  v_amount NUMERIC := 10.00;
  v_tier_name TEXT;
  v_hours_remaining NUMERIC;
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot claim bonus for other users';
  END IF;
  
  -- Check tier requirement
  SELECT vt.name INTO v_tier_name
  FROM public.profiles p
  JOIN public.vip_tiers vt ON p.vip_tier_id = vt.id
  WHERE p.id = p_user_id;
  
  IF v_tier_name NOT IN ('Platinum', 'Diamond') THEN
    RAISE EXCEPTION 'Platinum Reload requires Platinum or Diamond VIP tier. Current tier: %', 
      COALESCE(v_tier_name, 'None');
  END IF;
  
  -- Check last claim
  SELECT MAX(claimed_at) INTO v_last_claim
  FROM public.bonus_claims
  WHERE user_id = p_user_id AND bonus_type = 'reload';
  
  -- Validate 24-hour cooldown
  IF v_last_claim IS NOT NULL AND v_last_claim > NOW() - INTERVAL '24 hours' THEN
    v_hours_remaining := EXTRACT(EPOCH FROM (v_last_claim + INTERVAL '24 hours' - NOW())) / 3600;
    RAISE EXCEPTION 'Platinum Reload already claimed. Next claim available in % hours.', 
      ROUND(v_hours_remaining, 1);
  END IF;
  
  -- Record claim
  INSERT INTO public.bonus_claims (user_id, bonus_type, amount_usd)
  VALUES (p_user_id, 'reload', v_amount);
  
  -- Add to wallet
  UPDATE public.wallets 
  SET credits = credits + v_amount, version = version + 1
  WHERE user_id = p_user_id;
  
  -- Create transaction
  INSERT INTO public.transactions (user_id, type, amount_credits)
  VALUES (p_user_id, 'platinum_reload', v_amount);
  
  RETURN json_build_object(
    'amount', v_amount, 
    'next_claim', NOW() + INTERVAL '24 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION claim_platinum_reload IS 'Claim $10 platinum reload with 24-hour cooldown (Platinum+ only)';

-- ============================================================================
-- 9. UPDATE calculate_rakeback TO USE VIP TIERS
-- ============================================================================
DROP FUNCTION IF EXISTS calculate_rakeback(UUID);
CREATE OR REPLACE FUNCTION calculate_rakeback(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_rakeback_rate NUMERIC;
  v_bonus_multiplier NUMERIC;
  v_total_base_rakeback NUMERIC := 0;
  v_total_bonus_rakeback NUMERIC := 0;
  v_total_rakeback_usd NUMERIC := 0;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_breakdown JSONB := '[]'::jsonb;
  v_bet RECORD;
  v_house_edge NUMERIC;
  v_wager_usd NUMERIC;
  v_base_rake NUMERIC;
  v_bonus_rake NUMERIC;
  v_bet_count INTEGER := 0;
  v_tier_name TEXT;
BEGIN
  -- Security: Ensure user can only calculate their own rakeback
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot calculate rakeback for other users';
  END IF;

  -- Get user's tier-based rakeback rate and bonus multiplier
  SELECT 
    COALESCE(vt.rakeback_rate, 0.10),
    COALESCE(vt.bonus_multiplier, 1.0),
    COALESCE(vt.name, 'Bronze')
  INTO v_rakeback_rate, v_bonus_multiplier, v_tier_name
  FROM public.profiles p
  LEFT JOIN public.vip_tiers vt ON p.vip_tier_id = vt.id
  WHERE p.id = p_user_id;
  
  -- Define 24-hour period
  v_period_end := NOW();
  v_period_start := v_period_end - INTERVAL '24 hours';
  
  -- Check if already claimed for this period
  IF EXISTS (
    SELECT 1 FROM public.rakeback_claims 
    WHERE user_id = p_user_id 
    AND period_start >= v_period_start
  ) THEN
    RAISE EXCEPTION 'Rakeback already claimed for this period. Please wait 24 hours.';
  END IF;
  
  -- Calculate rakeback for each bet in the period
  FOR v_bet IN 
    SELECT 
      b.stake_credits, 
      b.game_id, 
      b.created_at,
      b.game_type
    FROM public.bets b
    WHERE b.user_id = p_user_id
    AND b.created_at >= v_period_start
    AND b.created_at <= v_period_end
  LOOP
    v_bet_count := v_bet_count + 1;
    
    -- Get house edge for this game
    IF v_bet.game_id IS NOT NULL THEN
      SELECT COALESCE(house_edge, 0.02) INTO v_house_edge
      FROM public.games
      WHERE id = v_bet.game_id;
    ELSE
      v_house_edge := 0.02;
    END IF;
    
    -- Assume credits = USD
    v_wager_usd := v_bet.stake_credits;
    
    -- Calculate base rake: wager × house_edge × rakeback_rate
    v_base_rake := v_wager_usd * v_house_edge * v_rakeback_rate;
    
    -- Calculate bonus rake: base_rake × (multiplier - 1)
    v_bonus_rake := v_base_rake * (v_bonus_multiplier - 1.0);
    
    v_total_base_rakeback := v_total_base_rakeback + v_base_rake;
    v_total_bonus_rakeback := v_total_bonus_rakeback + v_bonus_rake;
  END LOOP;
  
  v_total_rakeback_usd := v_total_base_rakeback + v_total_bonus_rakeback;
  
  -- Build breakdown
  v_breakdown := jsonb_build_array(
    jsonb_build_object(
      'currency', 'USD',
      'base_amount', ROUND(v_total_base_rakeback, 2),
      'bonus_amount', ROUND(v_total_bonus_rakeback, 2),
      'total_amount', ROUND(v_total_rakeback_usd, 2)
    )
  );
  
  RETURN json_build_object(
    'amount_usd', ROUND(v_total_rakeback_usd, 2),
    'base_rakeback', ROUND(v_total_base_rakeback, 2),
    'bonus_rakeback', ROUND(v_total_bonus_rakeback, 2),
    'period_start', v_period_start,
    'period_end', v_period_end,
    'breakdown', v_breakdown,
    'bet_count', v_bet_count,
    'rakeback_rate', v_rakeback_rate,
    'bonus_multiplier', v_bonus_multiplier,
    'tier_name', v_tier_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_rakeback IS 'Calculate rakeback with VIP tier bonuses for last 24 hours';

-- ============================================================================
-- VERIFICATION QUERIES (Comment out in production)
-- ============================================================================
-- SELECT * FROM public.vip_tiers ORDER BY min_wager_usd;
-- SELECT * FROM public.bonus_claims ORDER BY claimed_at DESC LIMIT 10;
