-- =====================================================
-- Part 1: Tables and Indexes
-- Run this FIRST
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: dice_seeds
CREATE TABLE IF NOT EXISTS dice_seeds (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_seed TEXT NOT NULL,
    server_seed TEXT NOT NULL,
    server_seed_hash TEXT NOT NULL,
    nonce INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_rotation_at TIMESTAMPTZ
);

-- Table: dice_bets
CREATE TABLE IF NOT EXISTS dice_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bet_amount NUMERIC(20, 8) NOT NULL CHECK (bet_amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    target NUMERIC(5, 2) NOT NULL CHECK (target >= 1.00 AND target <= 98.99),
    roll_condition TEXT NOT NULL CHECK (roll_condition IN ('over', 'under')),
    multiplier NUMERIC(10, 4) NOT NULL,
    win_chance NUMERIC(6, 4) NOT NULL,
    house_edge NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    roll_result NUMERIC(5, 2) NOT NULL CHECK (roll_result >= 0.00 AND roll_result <= 99.99),
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

-- Table: dice_seed_history
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dice_bets_user_id ON dice_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_dice_bets_created_at ON dice_bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dice_bets_server_seed_hash ON dice_bets(server_seed_hash);
CREATE INDEX IF NOT EXISTS idx_dice_bets_public_feed ON dice_bets(is_public, created_at DESC) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_dice_seed_history_user ON dice_seed_history(user_id, revealed_at DESC);
