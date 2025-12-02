-- Secure Admin and Dashboard functions by setting search_path to public
-- This prevents privilege escalation via search_path hijacking

BEGIN;

-- Admin Functions
ALTER FUNCTION admin_summary() SET search_path = public;
ALTER FUNCTION admin_toggle_ban(uuid, boolean) SET search_path = public;
ALTER FUNCTION admin_change_role(uuid, text) SET search_path = public;
ALTER FUNCTION admin_approve_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION admin_reject_withdrawal(uuid, text) SET search_path = public;

-- User Stats Function
ALTER FUNCTION get_user_stats(uuid) SET search_path = public;

COMMIT;
