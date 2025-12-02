/*
  # Sports Betting Schema
  
  ## Tables
  - sports_events: Stores match data (teams, time, scores)
  - sports_markets: Stores odds for events
  - sports_bets: Stores user bets
  
  ## Security
  - RLS enabled on all tables
  - Public read access for events/markets
  - User-only access for bets
  
  ## Functions
  - place_sports_bet: Atomic transaction for placing a bet
*/

-- Create Sports Events Table
CREATE TABLE IF NOT EXISTS public.sports_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    sport_key TEXT NOT NULL,
    commence_time TIMESTAMPTZ NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    scores JSONB DEFAULT NULL,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(external_id, sport_key)
);

-- Create Sports Markets Table
CREATE TABLE IF NOT EXISTS public.sports_markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.sports_events(id) ON DELETE CASCADE,
    market_key TEXT NOT NULL,
    outcomes JSONB NOT NULL, -- Array of {name, price, point?}
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Sports Bets Table
CREATE TABLE IF NOT EXISTS public.sports_bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_id UUID REFERENCES public.sports_events(id),
    selection_name TEXT NOT NULL,
    odds NUMERIC NOT NULL,
    stake NUMERIC NOT NULL,
    potential_payout NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'won', 'lost', 'void')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.sports_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports_bets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read access for sports events" 
ON public.sports_events FOR SELECT TO public USING (true);

CREATE POLICY "Public read access for sports markets" 
ON public.sports_markets FOR SELECT TO public USING (true);

CREATE POLICY "Users can read own bets" 
ON public.sports_bets FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all" 
ON public.sports_events FOR ALL TO service_role USING (true);

CREATE POLICY "Service role can manage markets" 
ON public.sports_markets FOR ALL TO service_role USING (true);

-- Indexes
CREATE INDEX idx_sports_events_sport_key ON public.sports_events(sport_key);
CREATE INDEX idx_sports_events_commence_time ON public.sports_events(commence_time);
CREATE INDEX idx_sports_bets_user_id ON public.sports_bets(user_id);
CREATE INDEX idx_sports_bets_status ON public.sports_bets(status);

-- Secure Function to Place Bet
CREATE OR REPLACE FUNCTION public.place_sports_bet(
    p_event_id UUID,
    p_selection_name TEXT,
    p_odds NUMERIC,
    p_stake NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_current_balance NUMERIC;
    v_bet_id UUID;
    v_potential_payout NUMERIC;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check balance
    SELECT credits INTO v_current_balance
    FROM public.wallets
    WHERE user_id = v_user_id
    FOR UPDATE; -- Lock wallet row

    IF v_current_balance IS NULL OR v_current_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Calculate payout
    v_potential_payout := p_stake * p_odds;

    -- Deduct balance
    UPDATE public.wallets
    SET credits = credits - p_stake,
        version = version + 1,
        updated_at = NOW()
    WHERE user_id = v_user_id;

    -- Create Transaction Record
    INSERT INTO public.transactions (user_id, type, amount_credits)
    VALUES (v_user_id, 'bet', -p_stake);

    -- Insert Bet
    INSERT INTO public.sports_bets (
        user_id, event_id, selection_name, odds, stake, potential_payout, status
    )
    VALUES (
        v_user_id, p_event_id, p_selection_name, p_odds, p_stake, v_potential_payout, 'pending'
    )
    RETURNING id INTO v_bet_id;

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_current_balance - p_stake
    );
END;
$$;
