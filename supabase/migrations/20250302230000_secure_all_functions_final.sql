/*
  # Secure All Functions (Final Polish)
  
  ## Security Updates
  - Explicitly sets `search_path = public` for all RPC functions.
  - This prevents "search path hijacking" where a malicious user could potentially
    override standard SQL functions if they could manipulate the search path.
  - Resolves "Function Search Path Mutable" security advisories.

  ## Metadata
  - Schema-Category: "Security"
  - Impact-Level: "Low" (No logic changes, just security settings)
  - Requires-Backup: false
*/

-- 1. Betting & Wallet Functions
ALTER FUNCTION public.place_sports_bet(uuid, uuid, text, numeric, numeric) SET search_path = public;
ALTER FUNCTION public.increment_balance(uuid, numeric) SET search_path = public;
ALTER FUNCTION public.request_withdrawal(uuid, numeric, text, text) SET search_path = public;

-- 2. Admin Functions
ALTER FUNCTION public.admin_toggle_ban(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.admin_change_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_approve_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_reject_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_summary() SET search_path = public;

-- 3. User Stats
ALTER FUNCTION public.get_user_stats(uuid) SET search_path = public;
