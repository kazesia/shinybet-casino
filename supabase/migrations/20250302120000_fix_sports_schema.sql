/*
  # Fix Sports Betting Schema
  
  ## Query Description:
  This migration safely sets up the sports betting tables and policies.
  It handles cases where tables or policies might already exist to prevent errors.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Tables: sports_events, sports_markets, sports_bets
  - Policies: Public read for events/markets, User read for own bets
  - Functions: place_sports_bet (Atomic betting transaction)
*/

-- 1. Safely create tables
CREATE TABLE IF NOT EXISTS sports_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  sport_key TEXT,
  commence_time TIMESTAMPTZ,
  home_team TEXT,
  away_team TEXT,
  completed BOOLEAN DEFAULT FALSE,
  scores JSONB,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(external_id, sport_key)
);

CREATE TABLE IF NOT EXISTS sports_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES sports_events(id) ON DELETE CASCADE,
  market_key TEXT,
  outcomes JSONB,
  last_update TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sports_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  event_id UUID REFERENCES sports_events(id),
  selection_name TEXT,
  odds NUMERIC,
  stake NUMERIC,
  potential_payout NUMERIC,
  status TEXT CHECK (status IN ('pending', 'won', 'lost', 'void')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS (Safe to run multiple times)
ALTER TABLE sports_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports_bets ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Public read access for sports events" ON sports_events;
DROP POLICY IF EXISTS "Public read access for sports markets" ON sports_markets;
DROP POLICY IF EXISTS "Users can view own bets" ON sports_bets;
DROP POLICY IF EXISTS "Service role manages events" ON sports_events;
DROP POLICY IF EXISTS "Service role manages markets" ON sports_markets;

-- 4. Re-create policies
CREATE POLICY "Public read access for sports events" ON sports_events
  FOR SELECT USING (true);

CREATE POLICY "Public read access for sports markets" ON sports_markets
  FOR SELECT USING (true);

CREATE POLICY "Users can view own bets" ON sports_bets
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Safely create indexes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sports_events_sport_key') THEN
    CREATE INDEX idx_sports_events_sport_key ON sports_events(sport_key);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sports_events_commence_time') THEN
    CREATE INDEX idx_sports_events_commence_time ON sports_events(commence_time);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sports_bets_user_id') THEN
    CREATE INDEX idx_sports_bets_user_id ON sports_bets(user_id);
  END IF;
END $$;

-- 6. Create or Replace Betting Function
CREATE OR REPLACE FUNCTION place_sports_bet(
  p_user_id UUID,
  p_event_id UUID,
  p_selection_name TEXT,
  p_odds NUMERIC,
  p_stake NUMERIC,
  p_potential_payout NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
  v_bet_id UUID;
BEGIN
  -- Check balance
  SELECT credits INTO v_balance FROM wallets WHERE user_id = p_user_id;
  
  IF v_balance IS NULL OR v_balance < p_stake THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE wallets 
  SET credits = credits - p_stake, version = version + 1
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Insert Bet
  INSERT INTO sports_bets (user_id, event_id, selection_name, odds, stake, potential_payout, status)
  VALUES (p_user_id, p_event_id, p_selection_name, p_odds, p_stake, p_potential_payout, 'pending')
  RETURNING id INTO v_bet_id;

  -- Log Transaction
  INSERT INTO transactions (user_id, type, amount_credits)
  VALUES (p_user_id, 'bet', -p_stake);

  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'new_balance', v_new_balance,
    'status', 'success'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
