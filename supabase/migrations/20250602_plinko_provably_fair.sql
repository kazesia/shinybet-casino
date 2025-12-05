-- =====================================================
-- PLINKO PROVABLY FAIR MIGRATION
-- =====================================================
-- Creates plinko_bets table and betting functions
-- Reuses dice_seeds for seed management
-- =====================================================

-- Enable extensions (should already exist)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Step 1: Drop existing objects safely
-- =====================================================

DROP FUNCTION IF EXISTS place_plinko_bet(UUID, NUMERIC, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_plinko_path(TEXT, TEXT, INTEGER, INTEGER);
DROP TABLE IF EXISTS plinko_bets CASCADE;

-- =====================================================
-- Step 2: Create plinko_bets Table
-- =====================================================

CREATE TABLE plinko_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bet_amount NUMERIC(20, 8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    row_count INTEGER NOT NULL CHECK (row_count IN (8, 12, 16)),
    path_bits TEXT NOT NULL,
    end_position INTEGER NOT NULL,
    multiplier NUMERIC(10, 4) NOT NULL,
    payout NUMERIC(20, 8) NOT NULL DEFAULT 0,
    profit NUMERIC(20, 8) NOT NULL,
    won BOOLEAN NOT NULL,
    client_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    server_seed TEXT,
    nonce INTEGER NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_plinko_bets_user_id ON plinko_bets(user_id);
CREATE INDEX idx_plinko_bets_created_at ON plinko_bets(created_at DESC);
CREATE INDEX idx_plinko_bets_public ON plinko_bets(is_public, created_at DESC);

-- =====================================================
-- Step 3: Binomial Coefficient Function
-- =====================================================

CREATE OR REPLACE FUNCTION binomial_coefficient(n INTEGER, k INTEGER)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    result NUMERIC := 1;
    i INTEGER;
BEGIN
    IF k < 0 OR k > n THEN RETURN 0; END IF;
    IF k = 0 OR k = n THEN RETURN 1; END IF;
    
    -- Use smaller k for efficiency
    IF k > n - k THEN k := n - k; END IF;
    
    FOR i IN 0..(k - 1) LOOP
        result := result * (n - i) / (i + 1);
    END LOOP;
    
    RETURN ROUND(result);
END;
$$;

-- =====================================================
-- Step 4: Dynamic Multiplier Generator using Binomial Distribution
-- =====================================================

CREATE OR REPLACE FUNCTION get_plinko_multiplier(
    p_risk TEXT,
    p_rows INTEGER,
    p_position INTEGER
) RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_center NUMERIC;
    v_distance NUMERIC;
    v_curve_value NUMERIC;
    v_raw_mult NUMERIC;
    v_target_rtp NUMERIC;
    v_center_mult NUMERIC;
    v_edge_mult NUMERIC;
    v_steepness NUMERIC;
    v_min_mult NUMERIC;
BEGIN
    -- Risk tier configurations
    IF p_risk = 'low' THEN
        v_target_rtp := 0.99;
        v_center_mult := 1.0;
        v_edge_mult := 16;
        v_steepness := 1.5;
        v_min_mult := 0.5;
    ELSIF p_risk = 'medium' THEN
        v_target_rtp := 0.98;
        v_center_mult := 0.4;
        v_edge_mult := 110;
        v_steepness := 2.5;
        v_min_mult := 0.2;
    ELSE -- high
        v_target_rtp := 0.96;
        v_center_mult := 0.2;
        v_edge_mult := 1000;
        v_steepness := 4.0;
        v_min_mult := 0;
    END IF;
    
    -- Calculate distance from center (0 at center, 1 at edges)
    v_center := p_rows::NUMERIC / 2;
    v_distance := ABS(p_position - v_center) / v_center;
    
    -- Exponential curve from center to edge
    v_curve_value := POWER(v_distance, v_steepness);
    
    -- Interpolate between center and edge multiplier
    v_raw_mult := v_center_mult + (v_edge_mult - v_center_mult) * v_curve_value;
    
    -- Apply minimum and round
    RETURN ROUND(GREATEST(v_min_mult, v_raw_mult)::NUMERIC, 2);
END;
$$;

-- =====================================================
-- Step 4: Generate Plinko Path from Seeds
-- =====================================================

CREATE OR REPLACE FUNCTION get_plinko_path(
    p_client_seed TEXT,
    p_server_seed TEXT,
    p_nonce INTEGER,
    p_rows INTEGER
) RETURNS TABLE(path_bits TEXT, end_position INTEGER) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_path TEXT := '';
    v_position INTEGER := 0;
    v_hash TEXT;
    v_bit INTEGER;
    i INTEGER;
BEGIN
    -- Generate path bit for each row
    FOR i IN 0..(p_rows - 1) LOOP
        -- Hash: clientSeed:serverSeed:nonce:rowIndex
        v_hash := encode(
            digest(
                p_client_seed || ':' || p_server_seed || ':' || p_nonce::TEXT || ':' || i::TEXT,
                'sha256'
            ),
            'hex'
        );
        
        -- Take first 2 hex chars, convert to int, mod 2
        v_bit := ('x' || substring(v_hash from 1 for 2))::bit(8)::integer % 2;
        
        -- Append to path (0 = left, 1 = right)
        v_path := v_path || v_bit::TEXT;
        
        -- Update position (right moves increase position)
        v_position := v_position + v_bit;
    END LOOP;
    
    path_bits := v_path;
    end_position := v_position;
    RETURN NEXT;
END;
$$;

-- =====================================================
-- Step 5: Place Plinko Bet Function
-- =====================================================

CREATE OR REPLACE FUNCTION place_plinko_bet(
    p_user_id UUID,
    p_bet_amount NUMERIC,
    p_risk TEXT,
    p_rows INTEGER
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_balance NUMERIC;
    v_seeds RECORD;
    v_path RECORD;
    v_multiplier NUMERIC;
    v_payout NUMERIC;
    v_profit NUMERIC;
    v_won BOOLEAN;
    v_bet_id UUID;
BEGIN
    -- Validate inputs
    IF p_bet_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid bet amount';
    END IF;
    
    IF p_risk NOT IN ('low', 'medium', 'high') THEN
        RAISE EXCEPTION 'Invalid risk level';
    END IF;
    
    IF p_rows NOT IN (8, 12, 16) THEN
        RAISE EXCEPTION 'Invalid row count';
    END IF;
    
    -- Check balance (lock row for update)
    SELECT credits INTO v_balance FROM wallets WHERE user_id = p_user_id FOR UPDATE;
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'User wallet not found';
    END IF;
    IF v_balance < p_bet_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    -- Initialize seeds if needed (reuse dice_seeds)
    PERFORM initialize_user_seeds(p_user_id);
    
    -- Get current seeds
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    
    -- Generate path
    SELECT * INTO v_path FROM get_plinko_path(
        v_seeds.client_seed,
        v_seeds.server_seed,
        v_seeds.nonce,
        p_rows
    );
    
    -- Get multiplier for final position
    v_multiplier := get_plinko_multiplier(p_risk, p_rows, v_path.end_position);
    
    -- Calculate payout
    v_payout := p_bet_amount * v_multiplier;
    v_profit := v_payout - p_bet_amount;
    v_won := v_profit >= 0;
    
    -- Update user balance
    UPDATE wallets SET credits = credits - p_bet_amount + v_payout WHERE user_id = p_user_id;
    
    -- Record bet
    INSERT INTO plinko_bets (
        user_id, bet_amount, risk_level, row_count,
        path_bits, end_position, multiplier,
        payout, profit, won,
        client_seed, server_seed_hash, nonce
    ) VALUES (
        p_user_id, p_bet_amount, p_risk, p_rows,
        v_path.path_bits, v_path.end_position, v_multiplier,
        v_payout, v_profit, v_won,
        v_seeds.client_seed, v_seeds.server_seed_hash, v_seeds.nonce
    ) RETURNING id INTO v_bet_id;
    
    -- Increment nonce
    UPDATE dice_seeds SET nonce = nonce + 1, updated_at = NOW() WHERE user_id = p_user_id;
    
    -- Return result
    RETURN jsonb_build_object(
        'bet_id', v_bet_id,
        'path_bits', v_path.path_bits,
        'end_position', v_path.end_position,
        'multiplier', v_multiplier,
        'payout', v_payout,
        'profit', v_profit,
        'won', v_won,
        'nonce', v_seeds.nonce,
        'server_seed_hash', v_seeds.server_seed_hash
    );
END;
$$;

-- =====================================================
-- Step 6: RLS Policies
-- =====================================================

ALTER TABLE plinko_bets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_plinko_bets" ON plinko_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "public_plinko_bets" ON plinko_bets FOR SELECT USING (is_public = true);

-- =====================================================
-- Step 7: Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION place_plinko_bet TO authenticated;
GRANT EXECUTE ON FUNCTION get_plinko_path TO authenticated;
GRANT EXECUTE ON FUNCTION get_plinko_multiplier TO authenticated;
