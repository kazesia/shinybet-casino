-- Create view for bets with username anonymization based on user role
CREATE OR REPLACE VIEW admin_bets_view AS
SELECT 
  b.id,
  b.user_id,
  b.game_type,
  b.stake_credits,
  b.payout_credits,
  b.result,
  b.created_at,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
    THEN p.username
    ELSE 'User' || SUBSTRING(b.user_id::text, 1, 4)
  END as display_username
FROM bets b
LEFT JOIN profiles p ON p.id = b.user_id;

-- Add performance indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_bets_created_at_desc ON bets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_type ON bets(game_type);
CREATE INDEX IF NOT EXISTS idx_bets_stake_credits_desc ON bets(stake_credits DESC);
CREATE INDEX IF NOT EXISTS idx_bets_payout_credits_desc ON bets(payout_credits DESC);

-- Grant access to the view
GRANT SELECT ON admin_bets_view TO authenticated;
GRANT SELECT ON admin_bets_view TO anon;
