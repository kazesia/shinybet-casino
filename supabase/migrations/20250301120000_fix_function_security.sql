-- Title: Fix Function Search Path Security
-- Description: Explicitly sets search_path to 'public' for all RPC functions to prevent search path hijacking.

BEGIN;

-- Secure User Stats Function
ALTER FUNCTION IF EXISTS get_user_stats(uuid) SET search_path = public, pg_temp;

-- Secure Wallet Functions
ALTER FUNCTION IF EXISTS increment_balance(uuid, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS request_withdrawal(uuid, numeric, text, text) SET search_path = public, pg_temp;

-- Secure Admin Functions
ALTER FUNCTION IF EXISTS admin_summary() SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS admin_toggle_ban(uuid, boolean) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS admin_change_role(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS admin_approve_withdrawal(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS admin_reject_withdrawal(uuid, text) SET search_path = public, pg_temp;

COMMIT;
