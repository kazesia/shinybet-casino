-- Securely create or replace admin functions to fix missing function errors

-- 1. Admin Toggle Ban
CREATE OR REPLACE FUNCTION public.admin_toggle_ban(p_user_id uuid, p_status boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if executor is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE profiles
  SET banned = p_status
  WHERE id = p_user_id;
END;
$$;

-- 2. Admin Change Role
CREATE OR REPLACE FUNCTION public.admin_change_role(p_user_id uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if executor is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Super Admin only';
  END IF;

  IF p_role NOT IN ('user', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE profiles
  SET role = p_role
  WHERE id = p_user_id;
END;
$$;

-- 3. Admin Summary Stats
CREATE OR REPLACE FUNCTION public.admin_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users bigint;
  v_active_24h bigint;
  v_total_wagered numeric;
  v_net_profit numeric;
  v_house_edge_profit numeric;
BEGIN
  -- Check permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT count(*) INTO v_total_users FROM profiles;
  
  SELECT count(*) INTO v_active_24h FROM profiles 
  WHERE last_sign_in_at > (now() - interval '24 hours');

  -- Calculate stats from bets
  SELECT 
    COALESCE(sum(stake_credits), 0),
    COALESCE(sum(stake_credits - payout_credits), 0)
  INTO v_total_wagered, v_net_profit
  FROM bets;

  -- Theoretical profit (approx 1% of wagered)
  v_house_edge_profit := v_total_wagered * 0.01;

  RETURN json_build_object(
    'total_users', v_total_users,
    'active_users_24h', v_active_24h,
    'total_wagered', v_total_wagered,
    'net_profit', v_net_profit,
    'house_edge_profit', v_house_edge_profit
  );
END;
$$;

-- 4. Admin Approve Withdrawal
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(p_withdrawal_id uuid, p_tx_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE withdrawals
  SET status = 'paid',
      tx_hash = p_tx_hash,
      updated_at = now()
  WHERE id = p_withdrawal_id;
END;
$$;

-- 5. Admin Reject Withdrawal
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(p_withdrawal_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_amount numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get withdrawal details
  SELECT user_id, amount_credits INTO v_user_id, v_amount
  FROM withdrawals
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found or already processed';
  END IF;

  -- Refund user
  PERFORM increment_balance(v_user_id, v_amount);

  -- Update status
  UPDATE withdrawals
  SET status = 'rejected',
      rejection_reason = p_reason,
      updated_at = now()
  WHERE id = p_withdrawal_id;
END;
$$;
