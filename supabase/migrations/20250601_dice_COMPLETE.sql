-- =====================================================
-- COMPLETE DICE MIGRATION - Run this single file
-- =====================================================
-- This handles partial state and creates everything fresh
-- =====================================================

-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Step 1: Drop all existing objects safely
-- =====================================================

-- Drop functions first (they might reference tables)
DROP FUNCTION IF EXISTS place_dice_bet(UUID, NUMERIC, NUMERIC, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS rotate_dice_seeds(UUID);
DROP FUNCTION IF EXISTS update_client_seed(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_dice_seeds(UUID);
DROP FUNCTION IF EXISTS get_dice_roll(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS initialize_user_seeds(UUID);
DROP FUNCTION IF EXISTS calculate_dice_multiplier(NUMERIC, NUMERIC);

-- Drop view
DROP VIEW IF EXISTS dice_bet_history_view;

-- Drop tables with CASCADE to handle any dependencies
DROP TABLE IF EXISTS dice_seed_history CASCADE;
DROP TABLE IF EXISTS dice_bets CASCADE;
DROP TABLE IF EXISTS dice_seeds CASCADE;

-- =====================================================
-- Step 2: Create Tables
-- =====================================================

CREATE TABLE dice_seeds (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    nonce INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_rotation_at TIMESTAMPTZ
);

CREATE TABLE dice_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bet_amount NUMERIC(20, 8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    target NUMERIC(5, 2) NOT NULL,
    roll_condition TEXT NOT NULL,
    multiplier NUMERIC(10, 4) NOT NULL,
    win_chance NUMERIC(6, 4) NOT NULL,
    house_edge NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    roll_result NUMERIC(5, 2) NOT NULL,
    won BOOLEAN NOT NULL,
    payout NUMERIC(20, 8) NOT NULL DEFAULT 0,
    profit NUMERIC(20, 8) NOT NULL,
    client_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    server_seed TEXT,
    nonce INTEGER NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified BOOLEAN DEFAULT false
);

CREATE TABLE dice_seed_history (
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

-- Indexes
CREATE INDEX idx_dice_bets_user_id ON dice_bets(user_id);
CREATE INDEX idx_dice_bets_created_at ON dice_bets(created_at DESC);
CREATE INDEX idx_dice_bets_public ON dice_bets(is_public, created_at DESC);
CREATE INDEX idx_dice_history_user ON dice_seed_history(user_id);

-- =====================================================
-- Step 3: Create Functions
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_user_seeds(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_server_seed TEXT;
    v_client_seed TEXT;
    v_hash TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM dice_seeds WHERE user_id = p_user_id) THEN
        RETURN;
    END IF;
    v_server_seed := encode(gen_random_bytes(32), 'hex');
    v_client_seed := encode(gen_random_bytes(8), 'hex');
    v_hash := encode(digest(v_server_seed, 'sha256'), 'hex');
    INSERT INTO dice_seeds (user_id, client_seed, server_seed, server_seed_hash, nonce)
    VALUES (p_user_id, v_client_seed, v_server_seed, v_hash, 0);
END;
$$;

CREATE OR REPLACE FUNCTION get_dice_roll(p_client TEXT, p_server TEXT, p_nonce INTEGER)
RETURNS NUMERIC(5, 2) LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_hash TEXT;
    v_decimal BIGINT;
BEGIN
    v_hash := encode(digest(p_client || ':' || p_server || ':' || p_nonce::TEXT, 'sha256'), 'hex');
    v_decimal := ('x' || substring(v_hash from 1 for 8))::bit(32)::bigint;
    RETURN ROUND((v_decimal::NUMERIC / 4294967295.0) * 10000) / 100;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_dice_multiplier(p_chance NUMERIC, p_edge NUMERIC DEFAULT 1.00)
RETURNS NUMERIC(10, 4) LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
    RETURN ROUND((100.0 - p_edge) / p_chance, 4);
END;
$$;

CREATE OR REPLACE FUNCTION place_dice_bet(
    p_user_id UUID, p_amount NUMERIC, p_target NUMERIC, 
    p_condition TEXT, p_edge NUMERIC DEFAULT 1.00
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_bal NUMERIC; v_seeds RECORD; v_roll NUMERIC(5,2);
    v_chance NUMERIC; v_mult NUMERIC; v_won BOOLEAN;
    v_payout NUMERIC; v_profit NUMERIC; v_bet_id UUID;
BEGIN
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Invalid bet amount'; END IF;
    IF p_condition NOT IN ('over', 'under') THEN RAISE EXCEPTION 'Invalid condition'; END IF;
    
    SELECT balance INTO v_bal FROM profiles WHERE id = p_user_id FOR UPDATE;
    IF v_bal IS NULL THEN RAISE EXCEPTION 'User not found'; END IF;
    IF v_bal < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    
    PERFORM initialize_user_seeds(p_user_id);
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    
    v_chance := CASE WHEN p_condition = 'under' THEN p_target ELSE 100 - p_target END;
    v_mult := calculate_dice_multiplier(v_chance, p_edge);
    v_roll := get_dice_roll(v_seeds.client_seed, v_seeds.server_seed, v_seeds.nonce);
    v_won := CASE WHEN p_condition = 'under' THEN v_roll < p_target ELSE v_roll > p_target END;
    
    IF v_won THEN v_payout := p_amount * v_mult; v_profit := v_payout - p_amount;
    ELSE v_payout := 0; v_profit := -p_amount; END IF;
    
    UPDATE profiles SET balance = balance - p_amount + v_payout WHERE id = p_user_id;
    
    INSERT INTO dice_bets (user_id, bet_amount, target, roll_condition, multiplier, win_chance, 
        house_edge, roll_result, won, payout, profit, client_seed, server_seed_hash, nonce)
    VALUES (p_user_id, p_amount, p_target, p_condition, v_mult, v_chance, p_edge, 
        v_roll, v_won, v_payout, v_profit, v_seeds.client_seed, v_seeds.server_seed_hash, v_seeds.nonce)
    RETURNING id INTO v_bet_id;
    
    UPDATE dice_seeds SET nonce = nonce + 1, updated_at = NOW() WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object('bet_id', v_bet_id, 'roll', v_roll, 'won', v_won, 
        'payout', v_payout, 'profit', v_profit, 'multiplier', v_mult, 
        'nonce', v_seeds.nonce, 'server_seed_hash', v_seeds.server_seed_hash);
END;
$$;

CREATE OR REPLACE FUNCTION rotate_dice_seeds(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_seeds RECORD; v_new_seed TEXT; v_new_hash TEXT;
BEGIN
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    IF v_seeds IS NULL THEN
        PERFORM initialize_user_seeds(p_user_id);
        SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id;
    END IF;
    
    IF v_seeds.last_rotation_at IS NOT NULL AND v_seeds.last_rotation_at > NOW() - INTERVAL '1 minute' THEN
        RAISE EXCEPTION 'Please wait before rotating again';
    END IF;
    
    INSERT INTO dice_seed_history (user_id, client_seed, server_seed, server_seed_hash, start_nonce, end_nonce, created_at)
    VALUES (p_user_id, v_seeds.client_seed, v_seeds.server_seed, v_seeds.server_seed_hash, 0, GREATEST(0, v_seeds.nonce - 1), v_seeds.created_at);
    
    UPDATE dice_bets SET server_seed = v_seeds.server_seed 
    WHERE user_id = p_user_id AND server_seed_hash = v_seeds.server_seed_hash AND server_seed IS NULL;
    
    v_new_seed := encode(gen_random_bytes(32), 'hex');
    v_new_hash := encode(digest(v_new_seed, 'sha256'), 'hex');
    
    UPDATE dice_seeds SET server_seed = v_new_seed, server_seed_hash = v_new_hash, 
        nonce = 0, created_at = NOW(), updated_at = NOW(), last_rotation_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object('revealed_server_seed', v_seeds.server_seed, 'new_server_seed_hash', v_new_hash);
END;
$$;

CREATE OR REPLACE FUNCTION update_client_seed(p_user_id UUID, p_seed TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    PERFORM initialize_user_seeds(p_user_id);
    UPDATE dice_seeds SET client_seed = p_seed, updated_at = NOW() WHERE user_id = p_user_id;
    RETURN jsonb_build_object('success', true, 'client_seed', p_seed);
END;
$$;

CREATE OR REPLACE FUNCTION get_user_dice_seeds(p_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_seeds RECORD;
BEGIN
    PERFORM initialize_user_seeds(p_user_id);
    SELECT client_seed, server_seed_hash, nonce INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id;
    RETURN jsonb_build_object('client_seed', v_seeds.client_seed, 'server_seed_hash', v_seeds.server_seed_hash, 'nonce', v_seeds.nonce);
END;
$$;

-- =====================================================
-- Step 4: RLS Policies
-- =====================================================

ALTER TABLE dice_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_seed_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_seeds" ON dice_seeds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_bets" ON dice_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "public_bets" ON dice_bets FOR SELECT USING (is_public = true);
CREATE POLICY "own_history" ON dice_seed_history FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- Step 5: Grants
-- =====================================================

GRANT EXECUTE ON FUNCTION place_dice_bet TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_dice_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION update_client_seed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dice_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION get_dice_roll TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_dice_multiplier TO authenticated;
