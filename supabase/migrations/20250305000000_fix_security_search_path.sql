/*
  # Security Hardening: Fix Function Search Paths
  
  ## Query Description:
  This migration explicitly sets the `search_path` to `public` for all custom security-definer functions.
  This prevents malicious users from overriding standard SQL functions (like `lower`, `now`, etc.) 
  by creating objects in other schemas that might be in the search path.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low" (No data change, only function config)
  - Requires-Backup: false
  - Reversible: true

  ## Affected Functions:
  - place_sports_bet
  - increment_balance
  - request_withdrawal
  - get_user_stats
  - admin_summary
  - admin_toggle_ban
  - admin_change_role
  - admin_approve_withdrawal
  - admin_reject_withdrawal
*/

-- Secure Betting Functions
ALTER FUNCTION public.place_sports_bet(uuid, uuid, text, numeric, numeric) SET search_path = public;
ALTER FUNCTION public.increment_balance(uuid, numeric) SET search_path = public;

-- Secure Wallet Functions
ALTER FUNCTION public.request_withdrawal(uuid, numeric, text, text) SET search_path = public;

-- Secure Data Fetching
ALTER FUNCTION public.get_user_stats(uuid) SET search_path = public;

-- Secure Admin Functions
ALTER FUNCTION public.admin_summary() SET search_path = public;
ALTER FUNCTION public.admin_toggle_ban(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.admin_change_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_approve_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_reject_withdrawal(uuid, text) SET search_path = public;
