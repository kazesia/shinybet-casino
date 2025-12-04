-- Enable RLS on bets table
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view bets" ON bets;
DROP POLICY IF EXISTS "Users can insert their own bets" ON bets;

-- Allow anyone to read bets (for "All Bets" tab)
CREATE POLICY "Anyone can view bets"
ON bets FOR SELECT
USING (true);

-- Allow authenticated users to insert their own bets
CREATE POLICY "Users can insert their own bets"
ON bets FOR INSERT
WITH CHECK (auth.uid() = user_id);
