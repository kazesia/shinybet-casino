/*
  # Secure Game Engine Functions
  
  ## Description
  Implements the core server-side logic for the game engine, including:
  1. `get_user_24h_stats`: Calculates user's win/loss for the last 24 hours.
  2. `check_risk_limits`: Checks if user has exceeded any responsible gaming thresholds.
  3. `place_bet`: The atomic, secure function for placing bets. Handles RNG, house edge, balance updates, and risk checks.
  4. `admin_adjust_balance`: Secure function for admins to modify user balances with audit logging.
  
  ## Security
  - All functions are SECURITY DEFINER to run with elevated privileges but restricted by internal logic.
  - `search_path` is set to `public` to prevent search path hijacking.
  - Explicit role checks for admin functions.
*/

-- 1. Function to get user 24h stats
CREATE OR REPLACE FUNCTION public.get_user_24h_stats(p_user_id uuid)
RETURNS TABLE (
  total_loss numeric,
  total_win numeric,
  net_profit numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN payout_credits < stake_credits THEN stake_credits - payout_credits ELSE 0 END), 0) as total_loss,
    COALESCE(SUM(CASE WHEN payout_credits > stake_credits THEN payout_credits - stake_credits ELSE 0 END), 0) as total_win,
    COALESCE(SUM(payout_credits - stake_credits), 0) as net_profit
  FROM bets
  WHERE user_id = p_user_id
  AND created_at > now() - interval '24 hours';
END;
$$;

-- 2. Function to check risk limits
CREATE OR REPLACE FUNCTION public.check_risk_limits(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats record;
  v_limits jsonb;
  v_loss_warning numeric;
  v_loss_lock numeric;
  v_win_review numeric;
  v_flags jsonb;
BEGIN
  -- Get stats
  SELECT * INTO v_stats FROM get_user_24h_stats(p_user_id);
  
  -- Get limits
  SELECT value::jsonb INTO v_limits FROM settings WHERE key = 'risk_limits';
  
  -- Default limits if not set
  v_loss_warning := COALESCE((v_limits->>'loss_warning_24h')::numeric, 5000);
  v_loss_lock := COALESCE((v_limits->>'loss_lock_24h')::numeric, 10000);
  v_win_review := COALESCE((v_limits->>'win_review_24h')::numeric, 50000);
  
  v_flags := '{}'::jsonb;
  
  -- Check Loss Warning
  IF v_stats.total_loss >= v_loss_warning THEN
    v_flags := v_flags || '{"show_loss_warning": true}'::jsonb;
  END IF;
  
  -- Check Loss Lock (DISABLED per user request)
  -- IF v_stats.total_loss >= v_loss_lock THEN
  --   v_flags := v_flags || '{"locked_for_losses": true}'::jsonb;
  -- END IF;
  
  -- Check Win Review
  IF v_stats.total_win >= v_win_review THEN
    v_flags := v_flags || '{"flagged_for_win_review": true}'::jsonb;
    -- Auto-flag profile
    UPDATE profiles SET flagged_for_review = true WHERE id = p_user_id;
  END IF;
  
  RETURN v_flags;
END;
$$;

-- 3. Function to place bet (Core Engine)
CREATE OR REPLACE FUNCTION public.place_bet(
  p_game_type text,
  p_bet_amount numeric,
  p_client_seed text,
  p_game_params jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_balance numeric;
  v_house_edge numeric;
  v_risk_flags jsonb;
  v_roll numeric;
  v_target numeric;
  v_condition text;
  v_multiplier numeric;
  v_payout numeric;
  v_is_win boolean;
  v_bet_id uuid;
  v_new_balance numeric;
BEGIN
  -- 1. Checks
  -- Check user lock
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND locked_until > now()) THEN
    RAISE EXCEPTION 'Account is temporarily locked.';
  END IF;

  -- Check balance
  SELECT credits INTO v_balance FROM wallets WHERE user_id = v_user_id;
  IF v_balance < p_bet_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Check risk limits
  v_risk_flags := check_risk_limits(v_user_id);
  -- IF (v_risk_flags->>'locked_for_losses')::boolean THEN
  --   RAISE EXCEPTION 'Daily loss limit reached.';
  -- END IF;

  -- 2. Game Logic (Dice)
  IF p_game_type = 'Dice' THEN
    -- Get House Edge
    SELECT (value::jsonb->>'dice')::numeric INTO v_house_edge FROM settings WHERE key = 'house_edge';
    IF v_house_edge IS NULL THEN v_house_edge := 0.01; END IF; -- Default 1%

    -- Params
    v_target := (p_game_params->>'target')::numeric;
    v_condition := p_game_params->>'condition'; -- 'over' or 'under'
    
    -- RNG (Simple for now, should be HMAC-SHA256 in full prod)
    v_roll := floor(random() * 10000) / 100.0; -- 0.00 to 99.99
    
    -- Determine Win
    IF v_condition = 'over' THEN
      v_is_win := v_roll > v_target;
      -- Multiplier = (100 / (100 - target)) * (1 - edge)
      v_multiplier := (100.0 / (100.0 - v_target)) * (1.0 - v_house_edge);
    ELSE
      v_is_win := v_roll < v_target;
      -- Multiplier = (100 / target) * (1 - edge)
      v_multiplier := (100.0 / v_target) * (1.0 - v_house_edge);
    END IF;
    
    -- Cap multiplier to avoid infinity
    IF v_multiplier > 9900 THEN v_multiplier := 9900; END IF;
    
    -- Calculate Payout
    IF v_is_win THEN
      v_payout := p_bet_amount * v_multiplier;
    ELSE
      v_payout := 0;
    END IF;
    
  ELSE
    RAISE EXCEPTION 'Game type not supported';
  END IF;

  -- 3. Update Balance
  UPDATE wallets 
  SET credits = credits - p_bet_amount + v_payout 
  WHERE user_id = v_user_id
  RETURNING credits INTO v_new_balance;
  
  -- 4. Insert Bet
  INSERT INTO bets (user_id, game_type, stake_credits, payout_credits, result, raw_data)
  VALUES (
    v_user_id, 
    p_game_type, 
    p_bet_amount, 
    v_payout, 
    CASE WHEN v_is_win THEN 'win'::text ELSE 'loss'::text END,
    jsonb_build_object(
      'roll', v_roll, 
      'target', v_target, 
      'condition', v_condition, 
      'multiplier', v_multiplier,
      'house_edge', v_house_edge
    )
  ) RETURNING id INTO v_bet_id;
  
  -- 5. Return Result
  RETURN jsonb_build_object(
    'bet_id', v_bet_id,
    'won', v_is_win,
    'payout', v_payout,
    'new_balance', v_new_balance,
    'roll', v_roll,
    'multiplier', v_multiplier,
    'risk_flags', v_risk_flags
  );
END;
$$;

-- 4. Admin Adjust Balance
CREATE OR REPLACE FUNCTION public.admin_adjust_balance(
  p_user_id uuid,
  p_amount numeric,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
BEGIN
  -- Check Admin Role
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_admin_id 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update Wallet
  UPDATE wallets 
  SET credits = credits + p_amount 
  WHERE user_id = p_user_id;
  
  -- Log Adjustment
  INSERT INTO admin_balance_adjustments (admin_id, user_id, amount_credits, reason)
  VALUES (v_admin_id, p_user_id, p_amount, p_reason);
  
  -- Log Transaction (Fixed: removed status and metadata columns)
  INSERT INTO transactions (user_id, type, amount_credits)
  VALUES (
    p_user_id, 
    'admin_adjustment', 
    p_amount
  );
END;
$$;
