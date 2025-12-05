/*
  # Advanced VIP Reward Engine
  
  ## Description:
  Extends the VIP tier system with automated reward generation:
  - Weekly/Monthly wager rewards (% of total wagered)
  - Loss-based cashback (% of net losses)
  - Tier-based withdrawal priority
  - Automated reward cycles tracking
  
  ## New Tables:
  - vip_reward_cycles: Track weekly/monthly reward periods
  
  ## Modified Tables:
  - vip_tiers: Add reward rates and withdrawal priority
  - withdrawals: Add priority column
  
  ## Functions Created:
  - generate_weekly_rewards: Calculate and create weekly rewards
  - generate_monthly_rewards: Calculate and create monthly rewards
  - claim_vip_reward: Claim a pending reward
*/

-- ============================================================================
-- 1. EXTEND VIP_TIERS TABLE WITH REWARD RATES
-- ============================================================================
ALTER TABLE public.vip_tiers
ADD COLUMN IF NOT EXISTS weekly_reward_rate NUMERIC DEFAULT 0.002 CHECK (weekly_reward_rate >= 0 AND weekly_reward_rate <= 1),
ADD COLUMN IF NOT EXISTS monthly_reward_rate NUMERIC DEFAULT 0.01 CHECK (monthly_reward_rate >= 0 AND monthly_reward_rate <= 1),
ADD COLUMN IF NOT EXISTS cashback_rate NUMERIC DEFAULT 0.02 CHECK (cashback_rate >= 0 AND cashback_rate <= 1),
ADD COLUMN IF NOT EXISTS withdrawal_priority INTEGER DEFAULT 0;

-- Update existing tiers with reward rates
UPDATE public.vip_tiers SET
  weekly_reward_rate = 0.002,   -- 0.2%
  monthly_reward_rate = 0.008,  -- 0.8%
  cashback_rate = 0.02,         -- 2%
  withdrawal_priority = 0
WHERE name = 'Bronze';

UPDATE public.vip_tiers SET
  weekly_reward_rate = 0.003,   -- 0.3%
  monthly_reward_rate = 0.01,   -- 1.0%
  cashback_rate = 0.03,         -- 3%
  withdrawal_priority = 1
WHERE name = 'Silver';

UPDATE public.vip_tiers SET
  weekly_reward_rate = 0.004,   -- 0.4%
  monthly_reward_rate = 0.012,  -- 1.2%
  cashback_rate = 0.04,         -- 4%
  withdrawal_priority = 2
WHERE name = 'Gold';

UPDATE public.vip_tiers SET
  weekly_reward_rate = 0.005,   -- 0.5%
  monthly_reward_rate = 0.015,  -- 1.5%
  cashback_rate = 0.05,         -- 5%
  withdrawal_priority = 3
WHERE name = 'Platinum';

UPDATE public.vip_tiers SET
  weekly_reward_rate = 0.006,   -- 0.6%
  monthly_reward_rate = 0.02,   -- 2.0%
  cashback_rate = 0.06,         -- 6%
  withdrawal_priority = 4
WHERE name = 'Diamond';

COMMENT ON COLUMN public.vip_tiers.weekly_reward_rate IS 'Percentage of weekly wagered amount returned as reward';
COMMENT ON COLUMN public.vip_tiers.monthly_reward_rate IS 'Percentage of monthly wagered amount returned as reward';
COMMENT ON COLUMN public.vip_tiers.cashback_rate IS 'Percentage of net losses returned as cashback';
COMMENT ON COLUMN public.vip_tiers.withdrawal_priority IS 'Priority level for withdrawal processing (higher = faster)';

-- ============================================================================
-- 2. CREATE VIP_REWARD_CYCLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vip_reward_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier_id UUID REFERENCES public.vip_tiers(id) NOT NULL,
  tier_name TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_wagered NUMERIC NOT NULL DEFAULT 0 CHECK (total_wagered >= 0),
  total_won NUMERIC NOT NULL DEFAULT 0 CHECK (total_won >= 0),
  total_lost NUMERIC NOT NULL DEFAULT 0,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('wagerback', 'cashback')),
  reward_amount NUMERIC NOT NULL CHECK (reward_amount >= 0),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period, start_date, reward_type)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_reward_cycles_user_status 
ON public.vip_reward_cycles(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reward_cycles_period 
ON public.vip_reward_cycles(period, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_reward_cycles_status_created 
ON public.vip_reward_cycles(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.vip_reward_cycles ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
DROP POLICY IF EXISTS "Users can view own reward cycles" ON public.vip_reward_cycles;
CREATE POLICY "Users can view own reward cycles" ON public.vip_reward_cycles
FOR SELECT USING (auth.uid() = user_id);

COMMENT ON TABLE public.vip_reward_cycles IS 'Tracks weekly/monthly VIP rewards including wagerback and cashback';

-- ============================================================================
-- 3. MODIFY WITHDRAWALS TABLE
-- ============================================================================
ALTER TABLE public.withdrawals
ADD COLUMN IF NOT EXISTS withdrawal_priority INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_withdrawals_priority 
ON public.withdrawals(withdrawal_priority DESC, created_at DESC);

COMMENT ON COLUMN public.withdrawals.withdrawal_priority IS 'VIP priority level for faster processing';

-- ============================================================================
-- 4. RPC FUNCTION: generate_weekly_rewards
-- ============================================================================
DROP FUNCTION IF EXISTS generate_weekly_rewards();
CREATE OR REPLACE FUNCTION generate_weekly_rewards()
RETURNS JSON AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_user RECORD;
  v_rewards_generated INTEGER := 0;
  v_total_wagered NUMERIC;
  v_total_won NUMERIC;
  v_total_lost NUMERIC;
  v_wagerback NUMERIC;
  v_cashback NUMERIC;
BEGIN
  -- Calculate last week's date range (Monday to Sunday)
  v_end_date := CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
  v_start_date := v_end_date - INTERVAL '6 days';
  
  -- For each user with bets in the period
  FOR v_user IN
    SELECT DISTINCT
      b.user_id,
      p.vip_tier_id,
      vt.name as tier_name,
      vt.weekly_reward_rate,
      vt.cashback_rate
    FROM public.bets b
    JOIN public.profiles p ON b.user_id = p.id
    JOIN public.vip_tiers vt ON p.vip_tier_id = vt.id
    WHERE b.created_at >= v_start_date::TIMESTAMPTZ
    AND b.created_at < (v_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  LOOP
    -- Calculate totals for this user
    SELECT
      COALESCE(SUM(stake_credits), 0),
      COALESCE(SUM(CASE WHEN result = 'win' THEN payout_credits ELSE 0 END), 0)
    INTO v_total_wagered, v_total_won
    FROM public.bets
    WHERE user_id = v_user.user_id
    AND created_at >= v_start_date::TIMESTAMPTZ
    AND created_at < (v_end_date + INTERVAL '1 day')::TIMESTAMPTZ;
    
    v_total_lost := v_total_wagered - v_total_won;
    v_wagerback := v_total_wagered * v_user.weekly_reward_rate;
    
    -- Insert wagerback reward
    IF v_wagerback > 0 THEN
      INSERT INTO public.vip_reward_cycles (
        user_id, tier_id, tier_name, period,
        start_date, end_date,
        total_wagered, total_won, total_lost,
        reward_type, reward_amount
      ) VALUES (
        v_user.user_id, v_user.vip_tier_id, v_user.tier_name, 'weekly',
        v_start_date, v_end_date,
        v_total_wagered, v_total_won, v_total_lost,
        'wagerback', v_wagerback
      ) ON CONFLICT (user_id, period, start_date, reward_type) DO NOTHING;
      
      v_rewards_generated := v_rewards_generated + 1;
    END IF;
    
    -- Calculate cashback if net loss
    IF v_total_lost > 0 THEN
      v_cashback := v_total_lost * v_user.cashback_rate;
      
      INSERT INTO public.vip_reward_cycles (
        user_id, tier_id, tier_name, period,
        start_date, end_date,
        total_wagered, total_won, total_lost,
        reward_type, reward_amount
      ) VALUES (
        v_user.user_id, v_user.vip_tier_id, v_user.tier_name, 'weekly',
        v_start_date, v_end_date,
        v_total_wagered, v_total_won, v_total_lost,
        'cashback', v_cashback
      ) ON CONFLICT (user_id, period, start_date, reward_type) DO NOTHING;
      
      v_rewards_generated := v_rewards_generated + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'period', 'weekly',
    'start_date', v_start_date,
    'end_date', v_end_date,
    'rewards_generated', v_rewards_generated
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_weekly_rewards IS 'Generate weekly wagerback and cashback rewards for all users';

-- ============================================================================
-- 5. RPC FUNCTION: generate_monthly_rewards
-- ============================================================================
DROP FUNCTION IF EXISTS generate_monthly_rewards();
CREATE OR REPLACE FUNCTION generate_monthly_rewards()
RETURNS JSON AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_user RECORD;
  v_rewards_generated INTEGER := 0;
  v_total_wagered NUMERIC;
  v_total_won NUMERIC;
  v_total_lost NUMERIC;
  v_wagerback NUMERIC;
  v_cashback NUMERIC;
BEGIN
  -- Calculate last month's date range
  v_start_date := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  v_end_date := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE;
  
  -- For each user with bets in the period
  FOR v_user IN
    SELECT DISTINCT
      b.user_id,
      p.vip_tier_id,
      vt.name as tier_name,
      vt.monthly_reward_rate,
      vt.cashback_rate
    FROM public.bets b
    JOIN public.profiles p ON b.user_id = p.id
    JOIN public.vip_tiers vt ON p.vip_tier_id = vt.id
    WHERE b.created_at >= v_start_date::TIMESTAMPTZ
    AND b.created_at < (v_end_date + INTERVAL '1 day')::TIMESTAMPTZ
  LOOP
    -- Calculate totals for this user
    SELECT
      COALESCE(SUM(stake_credits), 0),
      COALESCE(SUM(CASE WHEN result = 'win' THEN payout_credits ELSE 0 END), 0)
    INTO v_total_wagered, v_total_won
    FROM public.bets
    WHERE user_id = v_user.user_id
    AND created_at >= v_start_date::TIMESTAMPTZ
    AND created_at < (v_end_date + INTERVAL '1 day')::TIMESTAMPTZ;
    
    v_total_lost := v_total_wagered - v_total_won;
    v_wagerback := v_total_wagered * v_user.monthly_reward_rate;
    
    -- Insert wagerback reward
    IF v_wagerback > 0 THEN
      INSERT INTO public.vip_reward_cycles (
        user_id, tier_id, tier_name, period,
        start_date, end_date,
        total_wagered, total_won, total_lost,
        reward_type, reward_amount
      ) VALUES (
        v_user.user_id, v_user.vip_tier_id, v_user.tier_name, 'monthly',
        v_start_date, v_end_date,
        v_total_wagered, v_total_won, v_total_lost,
        'wagerback', v_wagerback
      ) ON CONFLICT (user_id, period, start_date, reward_type) DO NOTHING;
      
      v_rewards_generated := v_rewards_generated + 1;
    END IF;
    
    -- Calculate cashback if net loss
    IF v_total_lost > 0 THEN
      v_cashback := v_total_lost * v_user.cashback_rate;
      
      INSERT INTO public.vip_reward_cycles (
        user_id, tier_id, tier_name, period,
        start_date, end_date,
        total_wagered, total_won, total_lost,
        reward_type, reward_amount
      ) VALUES (
        v_user.user_id, v_user.vip_tier_id, v_user.tier_name, 'monthly',
        v_start_date, v_end_date,
        v_total_wagered, v_total_won, v_total_lost,
        'cashback', v_cashback
      ) ON CONFLICT (user_id, period, start_date, reward_type) DO NOTHING;
      
      v_rewards_generated := v_rewards_generated + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'period', 'monthly',
    'start_date', v_start_date,
    'end_date', v_end_date,
    'rewards_generated', v_rewards_generated
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_monthly_rewards IS 'Generate monthly wagerback and cashback rewards for all users';

-- ============================================================================
-- 6. RPC FUNCTION: claim_vip_reward
-- ============================================================================
DROP FUNCTION IF EXISTS claim_vip_reward(UUID);
CREATE OR REPLACE FUNCTION claim_vip_reward(p_reward_id UUID)
RETURNS JSON AS $$
DECLARE
  v_reward RECORD;
BEGIN
  -- Get reward details with lock
  SELECT * INTO v_reward
  FROM public.vip_reward_cycles
  WHERE id = p_reward_id
  AND user_id = auth.uid()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or unauthorized';
  END IF;
  
  IF v_reward.status != 'pending' THEN
    RAISE EXCEPTION 'Reward already % at %', v_reward.status, v_reward.claimed_at;
  END IF;
  
  IF v_reward.reward_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid reward amount: %', v_reward.reward_amount;
  END IF;
  
  -- Transfer to wallet
  UPDATE public.wallets
  SET credits = credits + v_reward.reward_amount, version = version + 1
  WHERE user_id = v_reward.user_id;
  
  -- Mark as claimed
  UPDATE public.vip_reward_cycles
  SET status = 'claimed', claimed_at = NOW()
  WHERE id = p_reward_id;
  
  -- Create transaction
  INSERT INTO public.transactions (user_id, type, amount_credits, description)
  VALUES (
    v_reward.user_id, 
    v_reward.reward_type, 
    v_reward.reward_amount,
    FORMAT('%s %s reward (%s - %s)', 
      INITCAP(v_reward.period), 
      INITCAP(v_reward.reward_type),
      v_reward.start_date,
      v_reward.end_date
    )
  );
  
  RETURN json_build_object(
    'reward_id', p_reward_id,
    'amount', v_reward.reward_amount,
    'type', v_reward.reward_type,
    'period', v_reward.period,
    'tier', v_reward.tier_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION claim_vip_reward IS 'Claim a pending VIP reward and add to wallet';

-- ============================================================================
-- 7. HELPER FUNCTION: get_user_pending_rewards
-- ============================================================================
DROP FUNCTION IF EXISTS get_user_pending_rewards(UUID);
CREATE OR REPLACE FUNCTION get_user_pending_rewards(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  period TEXT,
  reward_type TEXT,
  reward_amount NUMERIC,
  tier_name TEXT,
  start_date DATE,
  end_date DATE,
  total_wagered NUMERIC,
  total_lost NUMERIC
) AS $$
BEGIN
  -- Security check
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view other users rewards';
  END IF;
  
  RETURN QUERY
  SELECT 
    vrc.id,
    vrc.period,
    vrc.reward_type,
    vrc.reward_amount,
    vrc.tier_name,
    vrc.start_date,
    vrc.end_date,
    vrc.total_wagered,
    vrc.total_lost
  FROM public.vip_reward_cycles vrc
  WHERE vrc.user_id = p_user_id
  AND vrc.status = 'pending'
  ORDER BY vrc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_pending_rewards IS 'Get all pending rewards for a user';
