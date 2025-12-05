-- =====================================================
-- STEP 1: Drop existing objects (run this first)
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own seeds" ON dice_seeds;
DROP POLICY IF EXISTS "Users can view own bets" ON dice_bets;
DROP POLICY IF EXISTS "Public bets visible" ON dice_bets;
DROP POLICY IF EXISTS "Users can view own seed history" ON dice_seed_history;

-- Drop existing functions
DROP FUNCTION IF EXISTS place_dice_bet(UUID, NUMERIC, NUMERIC, TEXT, NUMERIC);
DROP FUNCTION IF EXISTS rotate_dice_seeds(UUID);
DROP FUNCTION IF EXISTS update_client_seed(UUID, TEXT);
DROP FUNCTION IF EXISTS get_user_dice_seeds(UUID);
DROP FUNCTION IF EXISTS get_dice_roll(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS initialize_user_seeds(UUID);
DROP FUNCTION IF EXISTS calculate_dice_multiplier(NUMERIC, NUMERIC);

-- Drop existing view
DROP VIEW IF EXISTS dice_bet_history_view;

-- Drop existing tables (in order due to foreign keys)
DROP TABLE IF EXISTS dice_seed_history CASCADE;
DROP TABLE IF EXISTS dice_bets CASCADE;
DROP TABLE IF EXISTS dice_seeds CASCADE;
