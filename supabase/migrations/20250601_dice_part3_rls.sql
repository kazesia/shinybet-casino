-- =====================================================
-- Part 3: RLS and Grants
-- Run this AFTER Part 2
-- =====================================================

-- RLS Policies
ALTER TABLE dice_seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dice_seed_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own seeds" ON dice_seeds;
DROP POLICY IF EXISTS "Users can view own bets" ON dice_bets;
DROP POLICY IF EXISTS "Public bets visible" ON dice_bets;
DROP POLICY IF EXISTS "Users can view own seed history" ON dice_seed_history;

-- Create policies
CREATE POLICY "Users can view own seeds" ON dice_seeds
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bets" ON dice_bets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Public bets visible" ON dice_bets
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own seed history" ON dice_seed_history
    FOR SELECT USING (auth.uid() = user_id);

-- Grants
GRANT EXECUTE ON FUNCTION place_dice_bet TO authenticated;
GRANT EXECUTE ON FUNCTION rotate_dice_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION update_client_seed TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_dice_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION get_dice_roll TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_seeds TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_dice_multiplier TO authenticated;
