/*
  # Fix Function Search Paths (Security Hardening)
  
  ## Query Description:
  This migration fixes the syntax error from the previous attempt.
  It explicitly sets the `search_path` for all security-critical functions to `public, pg_temp`.
  This prevents "search path hijacking" where malicious users could create objects in other schemas that shadow system functions.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low" (Configuration change only)
  - Requires-Backup: false
  - Reversible: true

  ## Affected Functions:
  - get_user_stats
  - increment_balance
  - request_withdrawal
  - admin_* functions
*/

-- Secure User Functions
ALTER FUNCTION get_user_stats(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION increment_balance(uuid, double precision) SET search_path = public, pg_temp;
ALTER FUNCTION request_withdrawal(uuid, double precision, text, text) SET search_path = public, pg_temp;

-- Secure Admin Functions
ALTER FUNCTION admin_summary() SET search_path = public, pg_temp;
ALTER FUNCTION admin_toggle_ban(uuid, boolean) SET search_path = public, pg_temp;
ALTER FUNCTION admin_change_role(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION admin_approve_withdrawal(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION admin_reject_withdrawal(uuid, text) SET search_path = public, pg_temp;
