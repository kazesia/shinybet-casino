-- Secure increment_balance (Fixed signature from previous step)
ALTER FUNCTION public.increment_balance(uuid, double precision) SET search_path = public;

-- Secure place_sports_bet
-- Signature: p_user_id uuid, p_event_id uuid, p_selection_name text, p_odds numeric, p_stake numeric, p_potential_payout numeric
ALTER FUNCTION public.place_sports_bet(uuid, uuid, text, numeric, numeric, numeric) SET search_path = public;

-- Secure request_withdrawal
-- Signature: p_user_id uuid, p_amount numeric, p_currency text, p_address text
ALTER FUNCTION public.request_withdrawal(uuid, numeric, text, text) SET search_path = public;

-- Secure Admin Functions
ALTER FUNCTION public.admin_summary() SET search_path = public;
ALTER FUNCTION public.admin_toggle_ban(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.admin_change_role(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_approve_withdrawal(uuid, text) SET search_path = public;
ALTER FUNCTION public.admin_reject_withdrawal(uuid, text) SET search_path = public;

-- Secure User Stats
ALTER FUNCTION public.get_user_stats(uuid) SET search_path = public;
