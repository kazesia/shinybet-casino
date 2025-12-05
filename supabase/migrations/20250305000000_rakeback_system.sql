/*
  # Rakeback System Implementation
  
  ## Description:
  This migration implements a production-ready rakeback system where players earn
  a percentage of their wagering volume back over time. Rakeback is calculated as:
  Rakeback = wagered_amount × house_edge × rakeback_rate
  
  ## Tables Created:
  - games: Store game configurations with house edge
  - rakeback_claims: Track all rakeback claims with unique constraints
  - crypto_prices: Cache crypto prices for USD conversion
  
  ## Tables Modified:
  - profiles: Add rakeback_rate column
  - bets: Add game_id foreign key
  
  ## Functions Created:
  - calculate_rakeback(user_id): Calculate available rakeback for 24h period
  - claim_rakeback(user_id): Claim rakeback and add to wallet
  - update_crypto_prices(): Update cached crypto prices
*/

-- ============================================================================
-- 1. CREATE GAMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  house_edge NUMERIC NOT NULL DEFAULT 0.02, -- 2% default
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Public read access for games
DROP POLICY IF EXISTS "Public can view games" ON public.games;
CREATE POLICY "Public can view games" ON public.games FOR SELECT USING (true);

-- ============================================================================
-- 2. CREATE RAKEBACK_CLAIMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rakeback_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_usd NUMERIC NOT NULL CHECK (amount_usd > 0),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start) -- Prevent double claims for same period
);

-- Enable RLS
ALTER TABLE public.rakeback_claims ENABLE ROW LEVEL SECURITY;

-- Users can only view their own claims
DROP POLICY IF EXISTS "Users can view own claims" ON public.rakeback_claims;
CREATE POLICY "Users can view own claims" ON public.rakeback_claims 
FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 3. CREATE CRYPTO_PRICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crypto_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency TEXT NOT NULL UNIQUE,
  price_usd NUMERIC NOT NULL CHECK (price_usd > 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.crypto_prices ENABLE ROW LEVEL SECURITY;

-- Public read access for prices
DROP POLICY IF EXISTS "Public can view prices" ON public.crypto_prices;
CREATE POLICY "Public can view prices" ON public.crypto_prices FOR SELECT USING (true);

-- ============================================================================
-- 4. MODIFY PROFILES TABLE
-- ============================================================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rakeback_rate NUMERIC DEFAULT 0.10 CHECK (rakeback_rate >= 0 AND rakeback_rate <= 1);

COMMENT ON COLUMN public.profiles.rakeback_rate IS 'Rakeback rate as decimal (0.10 = 10%)';

-- ============================================================================
-- 5. MODIFY BETS TABLE
-- ============================================================================
ALTER TABLE public.bets 
ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES public.games(id);

-- ============================================================================
-- 6. RPC FUNCTION: calculate_rakeback
-- ============================================================================
DROP FUNCTION IF EXISTS calculate_rakeback(UUID);
CREATE OR REPLACE FUNCTION calculate_rakeback(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_rakeback_rate NUMERIC;
  v_total_rakeback_usd NUMERIC := 0;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_breakdown JSONB := '[]'::jsonb;
  v_bet RECORD;
  v_house_edge NUMERIC;
  v_wager_usd NUMERIC;
  v_rake NUMERIC;
  v_bet_count INTEGER := 0;
BEGIN
  -- Security: Ensure user can only calculate their own rakeback
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot calculate rakeback for other users';
  END IF;

  -- Get user's rakeback rate
  SELECT COALESCE(rakeback_rate, 0.10) INTO v_rakeback_rate 
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Define 12-hour period
  v_period_end := NOW();
  v_period_start := v_period_end - INTERVAL '12 hours';
  
  -- Check if already claimed for this period
  IF EXISTS (
    SELECT 1 FROM public.rakeback_claims 
    WHERE user_id = p_user_id 
    AND period_start >= v_period_start
  ) THEN
    RAISE EXCEPTION 'Rakeback already claimed for this period. Please wait 12 hours.';
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
      -- Default house edge if game not linked
      v_house_edge := 0.02;
    END IF;
    
    -- For now, assume credits = USD (will be enhanced with crypto prices)
    v_wager_usd := v_bet.stake_credits;
    
    -- Calculate rake for this bet: wager × house_edge × rakeback_rate
    v_rake := v_wager_usd * v_house_edge * v_rakeback_rate;
    v_total_rakeback_usd := v_total_rakeback_usd + v_rake;
  END LOOP;
  
  -- Build breakdown (placeholder for now, will add crypto breakdown later)
  v_breakdown := jsonb_build_array(
    jsonb_build_object(
      'currency', 'USD',
      'amount', ROUND(v_total_rakeback_usd, 2)
    )
  );
  
  RETURN json_build_object(
    'amount_usd', ROUND(v_total_rakeback_usd, 2),
    'period_start', v_period_start,
    'period_end', v_period_end,
    'breakdown', v_breakdown,
    'bet_count', v_bet_count,
    'rakeback_rate', v_rakeback_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_rakeback IS 'Calculate available rakeback for user in last 24 hours';

-- ============================================================================
-- 7. RPC FUNCTION: claim_rakeback
-- ============================================================================
DROP FUNCTION IF EXISTS claim_rakeback(UUID);
CREATE OR REPLACE FUNCTION claim_rakeback(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_rakeback_data JSON;
  v_amount_usd NUMERIC;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_breakdown JSONB;
BEGIN
  -- Security: Ensure user can only claim their own rakeback
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot claim rakeback for other users';
  END IF;

  -- Calculate rakeback (includes validation and double-claim check)
  v_rakeback_data := calculate_rakeback(p_user_id);
  
  v_amount_usd := (v_rakeback_data->>'amount_usd')::NUMERIC;
  v_period_start := (v_rakeback_data->>'period_start')::TIMESTAMPTZ;
  v_period_end := (v_rakeback_data->>'period_end')::TIMESTAMPTZ;
  v_breakdown := (v_rakeback_data->>'breakdown')::JSONB;
  
  -- Prevent claiming zero or negative amounts
  IF v_amount_usd <= 0 THEN
    RAISE EXCEPTION 'No rakeback available to claim. Place more bets to earn rakeback.';
  END IF;
  
  -- Record the claim (unique constraint prevents double claims)
  INSERT INTO public.rakeback_claims (
    user_id, 
    amount_usd, 
    period_start, 
    period_end,
    details
  ) VALUES (
    p_user_id,
    v_amount_usd,
    v_period_start,
    v_period_end,
    v_breakdown
  );
  
  -- Add to user's wallet
  UPDATE public.wallets 
  SET credits = credits + v_amount_usd,
      version = version + 1
  WHERE user_id = p_user_id;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, amount_credits)
  VALUES (p_user_id, 'rakeback', v_amount_usd);
  
  RETURN v_rakeback_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION claim_rakeback IS 'Claim rakeback and add to wallet balance';

-- ============================================================================
-- 8. RPC FUNCTION: update_crypto_prices
-- ============================================================================
DROP FUNCTION IF EXISTS update_crypto_prices();
CREATE OR REPLACE FUNCTION update_crypto_prices()
RETURNS VOID AS $$
BEGIN
  -- This will be called by a cron job or edge function
  -- Prices will be fetched from external API and inserted here
  -- For now, insert placeholder prices
  
  INSERT INTO public.crypto_prices (currency, price_usd, updated_at)
  VALUES 
    ('BTC', 95000, NOW()),
    ('ETH', 3500, NOW()),
    ('LTC', 100, NOW()),
    ('USDT', 1, NOW())
  ON CONFLICT (currency) 
  DO UPDATE SET 
    price_usd = EXCLUDED.price_usd,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_crypto_prices IS 'Update cached crypto prices (called by cron/edge function)';

-- ============================================================================
-- 9. SEED DATA: Insert Default Games
-- ============================================================================
INSERT INTO public.games (name, house_edge) VALUES
  ('Blackjack', 0.01),   -- 1%
  ('Roulette', 0.027),   -- 2.7%
  ('Dice', 0.02),        -- 2%
  ('Crash', 0.02),       -- 2%
  ('Slots', 0.03),       -- 3%
  ('Plinko', 0.02),      -- 2%
  ('Mines', 0.01),       -- 1%
  ('Wheel', 0.025)       -- 2.5%
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 10. Initialize Crypto Prices
-- ============================================================================
SELECT update_crypto_prices();

-- ============================================================================
-- 11. Create Index for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_bets_user_created 
ON public.bets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rakeback_claims_user_period 
ON public.rakeback_claims(user_id, period_start DESC);

-- ============================================================================
-- VERIFICATION QUERIES (Comment out in production)
-- ============================================================================
-- SELECT * FROM public.games;
-- SELECT * FROM public.crypto_prices;
-- SELECT calculate_rakeback(auth.uid());
