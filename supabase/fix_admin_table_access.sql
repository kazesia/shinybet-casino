-- FIX ADMIN TABLE ACCESS
-- Add RLS SELECT policies to allow users to view their own data
-- Admin functions already use SECURITY DEFINER and bypass RLS
-- ================================================================

BEGIN;

-- WITHDRAWALS TABLE
-- Drop any existing SELECT policies first
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Enable read access for users" ON withdrawals;

-- Allow users to view their own withdrawals
CREATE POLICY "Users can view own withdrawals"
ON withdrawals FOR SELECT
USING (auth.uid() = user_id);

-- DEPOSITS TABLE
-- Drop any existing SELECT policies first
DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
DROP POLICY IF EXISTS "Enable read access for users" ON deposits;

-- Allow users to view their own deposits
CREATE POLICY "Users can view own deposits"
ON deposits FOR SELECT
USING (auth.uid() = user_id);

-- BETS TABLE
-- Drop any existing SELECT policies first
DROP POLICY IF EXISTS "Users can view own bets" ON bets;
DROP POLICY IF EXISTS "Enable read access for users" ON bets;

-- Allow users to view their own bets
CREATE POLICY "Users can view own bets"
ON bets FOR SELECT
USING (auth.uid() = user_id);

COMMIT;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('withdrawals', 'deposits', 'bets')
ORDER BY tablename, policyname;
