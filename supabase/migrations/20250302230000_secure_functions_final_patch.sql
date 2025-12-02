-- Secure all critical business logic functions
ALTER FUNCTION place_sports_bet(uuid, uuid, text, numeric, numeric) SET search_path = public;
ALTER FUNCTION increment_balance(uuid, numeric) SET search_path = public;
ALTER FUNCTION request_withdrawal(uuid, numeric, text, text) SET search_path = public;
ALTER FUNCTION get_user_stats(uuid) SET search_path = public;

-- Secure all admin functions
ALTER FUNCTION admin_toggle_ban(uuid, boolean) SET search_path = public;
ALTER FUNCTION admin_change_role(uuid, text) SET search_path = public;
ALTER FUNCTION admin_approve_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION admin_reject_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION admin_summary() SET search_path = public;
