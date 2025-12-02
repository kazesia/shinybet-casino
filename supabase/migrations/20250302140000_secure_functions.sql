/*
  # Secure RPC Functions
  
  ## Security Updates:
  - Set search_path to 'public' for all RPC functions to prevent search path hijacking.
  - This addresses the "Function Search Path Mutable" security advisory.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low" (Configuration change only)
  - Requires-Backup: false
  - Reversible: true
*/

-- Secure Betting Functions
ALTER FUNCTION public.place_sports_bet SET search_path = public;
ALTER FUNCTION public.increment_balance SET search_path = public;

-- Secure Wallet Functions
ALTER FUNCTION public.request_withdrawal SET search_path = public;

-- Secure Admin Functions (if they exist from previous migrations)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_summary') THEN
        ALTER FUNCTION public.admin_summary SET search_path = public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_toggle_ban') THEN
        ALTER FUNCTION public.admin_toggle_ban SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_change_role') THEN
        ALTER FUNCTION public.admin_change_role SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_approve_withdrawal') THEN
        ALTER FUNCTION public.admin_approve_withdrawal SET search_path = public;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_reject_withdrawal') THEN
        ALTER FUNCTION public.admin_reject_withdrawal SET search_path = public;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_stats') THEN
        ALTER FUNCTION public.get_user_stats SET search_path = public;
    END IF;
END
$$;
