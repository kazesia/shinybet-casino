-- Secure all functions to fix "Function Search Path Mutable" warnings
-- This prevents malicious users from hijacking the search path to execute arbitrary code

DO $$ 
BEGIN
  -- Wallet & Betting Functions
  EXECUTE 'ALTER FUNCTION increment_balance(uuid, numeric) SET search_path = public';
  EXECUTE 'ALTER FUNCTION place_sports_bet(uuid, uuid, text, numeric, numeric) SET search_path = public';
  EXECUTE 'ALTER FUNCTION get_user_stats(uuid) SET search_path = public';
  
  -- Fairness & Seeds
  EXECUTE 'ALTER FUNCTION get_user_seeds(uuid) SET search_path = public';
  EXECUTE 'ALTER FUNCTION rotate_seed(text) SET search_path = public';
  
  -- Vault & Transactions
  EXECUTE 'ALTER FUNCTION vault_transfer(numeric, text) SET search_path = public';
  EXECUTE 'ALTER FUNCTION request_withdrawal(uuid, numeric, text, text) SET search_path = public';
  
  -- Admin Functions
  EXECUTE 'ALTER FUNCTION admin_summary() SET search_path = public';
  EXECUTE 'ALTER FUNCTION admin_toggle_ban(uuid, boolean) SET search_path = public';
  EXECUTE 'ALTER FUNCTION admin_change_role(uuid, text) SET search_path = public';
  EXECUTE 'ALTER FUNCTION admin_approve_withdrawal(uuid, text) SET search_path = public';
  EXECUTE 'ALTER FUNCTION admin_reject_withdrawal(uuid, text) SET search_path = public';
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if functions don't exist (e.g. partial migrations)
    RAISE NOTICE 'Some functions could not be updated: %', SQLERRM;
END $$;

-- Ensure bets table has appropriate indexes for high-volume crash games
CREATE INDEX IF NOT EXISTS idx_bets_game_type ON bets(game_type);
CREATE INDEX IF NOT EXISTS idx_bets_created_at ON bets(created_at DESC);
