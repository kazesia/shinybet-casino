-- =====================================================
-- Provably Fair Dice Game Schema
-- =====================================================
-- This migration creates the database structure for a
-- production-quality provably fair dice game system.
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Table: dice_seeds
-- =====================================================
-- Stores the current seed pair for each user.
-- Server seed is only revealed after rotation.
-- =====================================================
CREATE TABLE IF NOT EXISTS dice_seeds (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL, -- Revealed only after rotation
    server_seed_hash TEXT NOT NULL, -- SHA256 hash shown before betting
    nonce INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_rotation_at TIMESTAMPTZ -- For rate limiting (1 per minute)
);

-- =====================================================
-- Table: dice_bets
-- =====================================================
-- Complete bet history with seed snapshots for verification.
-- Server seed is filled in after seed rotation.
-- =====================================================
CREATE TABLE IF NOT EXISTS dice_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Bet parameters
    bet_amount NUMERIC(20, 8) NOT NULL CHECK (bet_amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    target NUMERIC(5, 2) NOT NULL CHECK (target >= 1.00 AND target <= 98.99),
    roll_condition TEXT NOT NULL CHECK (roll_condition IN ('over', 'under')),
    
    -- Calculated values
    multiplier NUMERIC(10, 4) NOT NULL,
    win_chance NUMERIC(6, 4) NOT NULL,
    house_edge NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    
    -- Result
    roll_result NUMERIC(5, 2) NOT NULL CHECK (roll_result >= 0.00 AND roll_result <= 99.99),
    won BOOLEAN NOT NULL,
    payout NUMERIC(20, 8) NOT NULL DEFAULT 0,
    profit NUMERIC(20, 8) NOT NULL, -- payout - bet_amount (negative if loss)
    
    -- Provably fair data (snapshot at bet time)
    client_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    server_seed TEXT, -- NULL until seed rotation reveals it
    nonce INTEGER NOT NULL,
    
    -- Metadata
    is_public BOOLEAN NOT NULL DEFAULT true, -- Show in live feed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Verification status
    verified BOOLEAN DEFAULT false
);

-- =====================================================
-- Table: dice_seed_history
-- =====================================================
-- Historical record of all seed pairs after revelation.
-- Used for complete audit trail.
-- =====================================================
CREATE TABLE IF NOT EXISTS dice_seed_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    start_nonce INTEGER NOT NULL DEFAULT 0,
    end_nonce INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    revealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_dice_bets_user_id ON dice_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_dice_bets_created_at ON dice_bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dice_bets_server_seed_hash ON dice_bets(server_seed_hash);
CREATE INDEX IF NOT EXISTS idx_dice_bets_public_feed ON dice_bets(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_dice_seed_history_user ON dice_seed_history(user_id, revealed_at DESC);

-- =====================================================
-- View: dice_bet_history_view
-- =====================================================
-- Read-only view for audit and verification interface.
-- Joins bets with seed data for complete verification.
-- =====================================================
CREATE OR REPLACE VIEW dice_bet_history_view AS
SELECT 
    b.id,
    b.user_id,
    u.email,
    p.username,
    b.bet_amount,
    b.currency,
    b.target,
    b.roll_condition,
    b.multiplier,
    b.win_chance,
    b.house_edge,
    b.roll_result,
    b.won,
    b.payout,
    b.profit,
    b.client_seed,
    b.server_seed_hash,
    b.server_seed,
    b.nonce,
    b.verified,
    b.is_public,
    b.created_at,
    -- Can verify if server_seed is revealed
    (b.server_seed IS NOT NULL) AS can_verify
FROM dice_bets b
LEFT JOIN auth.users u ON b.user_id = u.id
LEFT JOIN profiles p ON b.user_id = p.id
ORDER BY b.created_at DESC;

-- =====================================================
-- Function: initialize_user_seeds
-- =====================================================
-- Creates initial seed pair for a new user.
-- Called on first bet or explicitly.
-- =====================================================
CREATE OR REPLACE FUNCTION initialize_user_seeds(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_server_seed TEXT;
    v_client_seed TEXT;
    v_server_seed_hash TEXT;
BEGIN
    -- Check if seeds already exist
    IF EXISTS (SELECT 1 FROM dice_seeds WHERE user_id = p_user_id) THEN
        RETURN;
    END IF;
    
    -- Generate random seeds
    v_server_seed := encode(gen_random_bytes(32), 'hex');
    v_client_seed := encode(gen_random_bytes(8), 'hex');
    v_server_seed_hash := encode(digest(v_server_seed, 'sha256'), 'hex');
    
    -- Insert seed record
    INSERT INTO dice_seeds (user_id, client_seed, server_seed, server_seed_hash, nonce)
    VALUES (p_user_id, v_client_seed, v_server_seed, v_server_seed_hash, 0);
END;
$$;

-- =====================================================
-- Function: get_dice_roll
-- =====================================================
-- Generates a provably fair dice roll result.
-- Uses: SHA256(client_seed:server_seed:nonce)
-- Returns: 0.00 to 99.99
-- =====================================================
CREATE OR REPLACE FUNCTION get_dice_roll(
    p_client_seed TEXT,
    p_server_seed TEXT,
    p_nonce INTEGER
)
RETURNS NUMERIC(5, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_full_seed TEXT;
    v_hash TEXT;
    v_hex TEXT;
    v_decimal BIGINT;
    v_result NUMERIC(5, 2);
BEGIN
    -- Combine seeds: client_seed:server_seed:nonce
    v_full_seed := p_client_seed || ':' || p_server_seed || ':' || p_nonce::TEXT;
    
    -- Generate SHA256 hash
    v_hash := encode(digest(v_full_seed, 'sha256'), 'hex');
    
    -- Take first 8 hex characters
    v_hex := substring(v_hash from 1 for 8);
    
    -- Convert to decimal (0 to 4294967295)
    v_decimal := ('x' || v_hex)::bit(32)::bigint;
    
    -- Convert to 0.00-99.99 range
    v_result := ROUND((v_decimal::NUMERIC / 4294967295.0) * 10000) / 100;
    
    -- Clamp to valid range
    v_result := GREATEST(0.00, LEAST(99.99, v_result));
    
    RETURN v_result;
END;
$$;

-- =====================================================
-- Function: calculate_dice_multiplier
-- =====================================================
-- Calculates multiplier with house edge.
-- Formula: (100 - houseEdge) / winChance
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_dice_multiplier(
    p_win_chance NUMERIC,
    p_house_edge NUMERIC DEFAULT 1.00
)
RETURNS NUMERIC(10, 4)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN ROUND((100.0 - p_house_edge) / p_win_chance, 4);
END;
$$;

-- =====================================================
-- Function: place_dice_bet
-- =====================================================
-- Main betting function. Handles the entire bet flow:
-- 1. Validate inputs
-- 2. Check/deduct balance
-- 3. Generate provably fair result
-- 4. Apply win/loss
-- 5. Record bet
-- 6. Increment nonce
-- =====================================================
CREATE OR REPLACE FUNCTION place_dice_bet(
    p_user_id UUID,
    p_bet_amount NUMERIC,
    p_target NUMERIC,
    p_roll_condition TEXT,
    p_house_edge NUMERIC DEFAULT 1.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_seeds RECORD;
    v_roll_result NUMERIC(5, 2);
    v_win_chance NUMERIC(6, 4);
    v_multiplier NUMERIC(10, 4);
    v_won BOOLEAN;
    v_payout NUMERIC(20, 8);
    v_profit NUMERIC(20, 8);
    v_bet_id UUID;
BEGIN
    -- Validate inputs
    IF p_bet_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid bet amount';
    END IF;
    
    IF p_target < 1.00 OR p_target > 98.99 THEN
        RAISE EXCEPTION 'Target must be between 1.00 and 98.99';
    END IF;
    
    IF p_roll_condition NOT IN ('over', 'under') THEN
        RAISE EXCEPTION 'Roll condition must be over or under';
    END IF;
    
    -- Get current balance
    SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF v_balance < p_bet_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Initialize seeds if not exists
    PERFORM initialize_user_seeds(p_user_id);
    
    -- Get current seeds
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    
    -- Calculate win chance based on condition
    IF p_roll_condition = 'under' THEN
        v_win_chance := p_target;
    ELSE
        v_win_chance := 100 - p_target;
    END IF;
    
    -- Calculate multiplier
    v_multiplier := calculate_dice_multiplier(v_win_chance, p_house_edge);
    
    -- Generate roll result
    v_roll_result := get_dice_roll(v_seeds.client_seed, v_seeds.server_seed, v_seeds.nonce);
    
    -- Determine win/loss
    IF p_roll_condition = 'under' THEN
        v_won := v_roll_result < p_target;
    ELSE
        v_won := v_roll_result > p_target;
    END IF;
    
    -- Calculate payout and profit
    IF v_won THEN
        v_payout := p_bet_amount * v_multiplier;
        v_profit := v_payout - p_bet_amount;
    ELSE
        v_payout := 0;
        v_profit := -p_bet_amount;
    END IF;
    
    -- Deduct bet and add payout atomically
    UPDATE profiles 
    SET balance = balance - p_bet_amount + v_payout
    WHERE id = p_user_id;
    
    -- Record bet
    INSERT INTO dice_bets (
        user_id, bet_amount, target, roll_condition,
        multiplier, win_chance, house_edge,
        roll_result, won, payout, profit,
        client_seed, server_seed_hash, nonce
    ) VALUES (
        p_user_id, p_bet_amount, p_target, p_roll_condition,
        v_multiplier, v_win_chance, p_house_edge,
        v_roll_result, v_won, v_payout, v_profit,
        v_seeds.client_seed, v_seeds.server_seed_hash, v_seeds.nonce
    )
    RETURNING id INTO v_bet_id;
    
    -- Increment nonce
    UPDATE dice_seeds 
    SET nonce = nonce + 1, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Return result
    RETURN jsonb_build_object(
        'bet_id', v_bet_id,
        'roll', v_roll_result,
        'won', v_won,
        'payout', v_payout,
        'profit', v_profit,
        'multiplier', v_multiplier,
        'target', p_target,
        'condition', p_roll_condition,
        'nonce', v_seeds.nonce,
        'server_seed_hash', v_seeds.server_seed_hash
    );
END;
$$;

-- =====================================================
-- Function: rotate_dice_seeds
-- =====================================================
-- Rotates server seed with rate limiting.
-- Reveals old seed and generates new one.
-- =====================================================
CREATE OR REPLACE FUNCTION rotate_dice_seeds(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seeds RECORD;
    v_new_server_seed TEXT;
    v_new_hash TEXT;
    v_last_rotation TIMESTAMPTZ;
BEGIN
    -- Get current seeds
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_seeds IS NULL THEN
        PERFORM initialize_user_seeds(p_user_id);
        SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id;
    END IF;
    
    -- Rate limiting: 1 rotation per minute
    IF v_seeds.last_rotation_at IS NOT NULL AND 
       v_seeds.last_rotation_at > NOW() - INTERVAL '1 minute' THEN
        RAISE EXCEPTION 'Please wait before rotating seeds again';
    END IF;
    
    -- Save old seeds to history
    INSERT INTO dice_seed_history (
        user_id, client_seed, server_seed, server_seed_hash,
        start_nonce, end_nonce, created_at
    ) VALUES (
        p_user_id, v_seeds.client_seed, v_seeds.server_seed, v_seeds.server_seed_hash,
        0, v_seeds.nonce - 1, v_seeds.created_at
    );
    
    -- Update all bets with revealed server seed
    UPDATE dice_bets 
    SET server_seed = v_seeds.server_seed
    WHERE user_id = p_user_id 
      AND server_seed_hash = v_seeds.server_seed_hash
      AND server_seed IS NULL;
    
    -- Generate new seed
    v_new_server_seed := encode(gen_random_bytes(32), 'hex');
    v_new_hash := encode(digest(v_new_server_seed, 'sha256'), 'hex');
    
    -- Update seeds
    UPDATE dice_seeds SET
        server_seed = v_new_server_seed,
        server_seed_hash = v_new_hash,
        nonce = 0,
        created_at = NOW(),
        updated_at = NOW(),
        last_rotation_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Return revealed seed info
    RETURN jsonb_build_object(
        'revealed_server_seed', v_seeds.server_seed,
        'revealed_hash', v_seeds.server_seed_hash,
        'bets_updated', v_seeds.nonce,
        'new_server_seed_hash', v_new_hash,
        'client_seed', v_seeds.client_seed
    );
END;
$$;

-- =====================================================
-- Function: update_client_seed
-- =====================================================
-- Allows user to change their client seed.
-- Takes effect on next bet.
-- =====================================================
CREATE OR REPLACE FUNCTION update_client_seed(
    p_user_id UUID,
    p_new_client_seed TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF length(p_new_client_seed) < 1 OR length(p_new_client_seed) > 64 THEN
        RAISE EXCEPTION 'Client seed must be 1-64 characters';
    END IF;
    
    -- Initialize if needed
    PERFORM initialize_user_seeds(p_user_id);
    
    UPDATE dice_seeds 
    SET client_seed = p_new_client_seed, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'client_seed', p_new_client_seed
    );
END;
$$;

-- =====================================================
-- Function: get_user_dice_seeds
-- =====================================================
-- Returns current seed info for display.
-- Server seed is NOT included (only hash).
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_dice_seeds(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seeds RECORD;
BEGIN
    -- Initialize if needed
    PERFORM initialize_user_seeds(p_user_id);
    
    SELECT client_seed, server_seed_hash, nonce
    INTO v_seeds
    FROM dice_seeds WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'client_seed', v_seeds.client_seed,
        'server_seed_hash', v_seeds.server_seed_hash,
        'nonce', v_seeds.nonce
    );
END;
$$;

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE dice_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_seed_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own seeds
CREATE POLICY "Users can view own seeds" ON dice_seeds
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own bets
CREATE POLICY "Users can view own bets" ON dice_bets
    FOR SELECT USING (auth.uid() = user_id);

-- Public bets visible in feed (limited data)
CREATE POLICY "Public bets visible" ON dice_bets
    FOR SELECT USING (is_public = true);

-- Users can view own seed history
CREATE POLICY "Users can view own seed history" ON dice_seed_history
    FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Grants
-- =====================================================
GRANT EXECUTE ON FUNCTION place_dice_bet TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_dice_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION update_client_seed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dice_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION get_dice_roll TO authenticated;
