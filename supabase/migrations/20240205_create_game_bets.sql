-- Create game_bets table
CREATE TABLE IF NOT EXISTS game_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  bet_amount NUMERIC NOT NULL,
  multiplier NUMERIC NOT NULL,
  payout NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE game_bets ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to read bets (for "All Bets" tab)
CREATE POLICY "Anyone can view game bets"
ON game_bets FOR SELECT
USING (true);

-- Allow authenticated users to insert their own bets
CREATE POLICY "Users can insert their own bets"
ON game_bets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table game_bets;
