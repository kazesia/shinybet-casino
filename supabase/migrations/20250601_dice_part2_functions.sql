-- =====================================================
-- Part 2: Functions
-- Run this AFTER Part 1
-- =====================================================

-- Function: initialize_user_seeds
CREATE OR REPLACE FUNCTION initialize_user_seeds(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_server_seed TEXT;
    v_client_seed TEXT;
    v_server_seed_hash TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM dice_seeds WHERE user_id = p_user_id) THEN
        RETURN;
    END IF;
    
    v_server_seed := encode(gen_random_bytes(32), 'hex');
    v_client_seed := encode(gen_random_bytes(8), 'hex');
    v_server_seed_hash := encode(digest(v_server_seed, 'sha256'), 'hex');
    
    INSERT INTO dice_seeds (user_id, client_seed, server_seed, server_seed_hash, nonce)
    VALUES (p_user_id, v_client_seed, v_server_seed, v_server_seed_hash, 0);
END;
$$;

-- Function: get_dice_roll
CREATE OR REPLACE FUNCTION get_dice_roll(
    p_client_seed TEXT,
    p_server_seed TEXT,
    p_nonce INTEGER
)
RETURNS NUMERIC(5, 2)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_full_seed TEXT;
    v_hash TEXT;
    v_hex TEXT;
    v_decimal BIGINT;
    v_result NUMERIC(5, 2);
BEGIN
    v_full_seed := p_client_seed || ':' || p_server_seed || ':' || p_nonce::TEXT;
    v_hash := encode(digest(v_full_seed, 'sha256'), 'hex');
    v_hex := substring(v_hash from 1 for 8);
    v_decimal := ('x' || v_hex)::bit(32)::bigint;
    v_result := ROUND((v_decimal::NUMERIC / 4294967295.0) * 10000) / 100;
    v_result := GREATEST(0.00, LEAST(99.99, v_result));
    RETURN v_result;
END;
$$;

-- Function: calculate_dice_multiplier
CREATE OR REPLACE FUNCTION calculate_dice_multiplier(
    p_win_chance NUMERIC,
    p_house_edge NUMERIC DEFAULT 1.00
)
RETURNS NUMERIC(10, 4)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN ROUND((100.0 - p_house_edge) / p_win_chance, 4);
END;
$$;

-- Function: place_dice_bet
CREATE OR REPLACE FUNCTION place_dice_bet(
    p_user_id UUID,
    p_bet_amount NUMERIC,
    p_target NUMERIC,
    p_roll_condition TEXT,
    p_house_edge NUMERIC DEFAULT 1.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance NUMERIC;
    v_seeds RECORD;
    v_roll_result NUMERIC(5, 2);
    v_win_chance NUMERIC(6, 4);
    v_multiplier NUMERIC(10, 4);
    v_won BOOLEAN;
    v_payout NUMERIC(20, 8);
    v_profit NUMERIC(20, 8);
    v_bet_id UUID;
BEGIN
    IF p_bet_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid bet amount';
    END IF;
    
    IF p_target < 1.00 OR p_target > 98.99 THEN
        RAISE EXCEPTION 'Target must be between 1.00 and 98.99';
    END IF;
    
    IF p_roll_condition NOT IN ('over', 'under') THEN
        RAISE EXCEPTION 'Roll condition must be over or under';
    END IF;
    
    SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id FOR UPDATE;
    
    IF v_balance IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    IF v_balance < p_bet_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;
    
    PERFORM initialize_user_seeds(p_user_id);
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    
    IF p_roll_condition = 'under' THEN
        v_win_chance := p_target;
    ELSE
        v_win_chance := 100 - p_target;
    END IF;
    
    v_multiplier := calculate_dice_multiplier(v_win_chance, p_house_edge);
    v_roll_result := get_dice_roll(v_seeds.client_seed, v_seeds.server_seed, v_seeds.nonce);
    
    IF p_roll_condition = 'under' THEN
        v_won := v_roll_result < p_target;
    ELSE
        v_won := v_roll_result > p_target;
    END IF;
    
    IF v_won THEN
        v_payout := p_bet_amount * v_multiplier;
        v_profit := v_payout - p_bet_amount;
    ELSE
        v_payout := 0;
        v_profit := -p_bet_amount;
    END IF;
    
    UPDATE profiles SET balance = balance - p_bet_amount + v_payout WHERE id = p_user_id;
    
    INSERT INTO dice_bets (
        user_id, bet_amount, target, roll_condition,
        multiplier, win_chance, house_edge,
        roll_result, won, payout, profit,
        client_seed, server_seed_hash, nonce
    ) VALUES (
        p_user_id, p_bet_amount, p_target, p_roll_condition,
        v_multiplier, v_win_chance, p_house_edge,
        v_roll_result, v_won, v_payout, v_profit,
        v_seeds.client_seed, v_seeds.server_seed_hash, v_seeds.nonce
    )
    RETURNING id INTO v_bet_id;
    
    UPDATE dice_seeds SET nonce = nonce + 1, updated_at = NOW() WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'bet_id', v_bet_id,
        'roll', v_roll_result,
        'won', v_won,
        'payout', v_payout,
        'profit', v_profit,
        'multiplier', v_multiplier,
        'target', p_target,
        'condition', p_roll_condition,
        'nonce', v_seeds.nonce,
        'server_seed_hash', v_seeds.server_seed_hash
    );
END;
$$;

-- Function: rotate_dice_seeds
CREATE OR REPLACE FUNCTION rotate_dice_seeds(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seeds RECORD;
    v_new_server_seed TEXT;
    v_new_hash TEXT;
BEGIN
    SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_seeds IS NULL THEN
        PERFORM initialize_user_seeds(p_user_id);
        SELECT * INTO v_seeds FROM dice_seeds WHERE user_id = p_user_id;
    END IF;
    
    IF v_seeds.last_rotation_at IS NOT NULL AND 
       v_seeds.last_rotation_at > NOW() - INTERVAL '1 minute' THEN
        RAISE EXCEPTION 'Please wait before rotating seeds again';
    END IF;
    
    INSERT INTO dice_seed_history (
        user_id, client_seed, server_seed, server_seed_hash,
        start_nonce, end_nonce, created_at
    ) VALUES (
        p_user_id, v_seeds.client_seed, v_seeds.server_seed, v_seeds.server_seed_hash,
        0, GREATEST(0, v_seeds.nonce - 1), v_seeds.created_at
    );
    
    UPDATE dice_bets 
    SET server_seed = v_seeds.server_seed
    WHERE user_id = p_user_id 
      AND server_seed_hash = v_seeds.server_seed_hash
      AND server_seed IS NULL;
    
    v_new_server_seed := encode(gen_random_bytes(32), 'hex');
    v_new_hash := encode(digest(v_new_server_seed, 'sha256'), 'hex');
    
    UPDATE dice_seeds SET
        server_seed = v_new_server_seed,
        server_seed_hash = v_new_hash,
        nonce = 0,
        created_at = NOW(),
        updated_at = NOW(),
        last_rotation_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'revealed_server_seed', v_seeds.server_seed,
        'revealed_hash', v_seeds.server_seed_hash,
        'bets_updated', v_seeds.nonce,
        'new_server_seed_hash', v_new_hash,
        'client_seed', v_seeds.client_seed
    );
END;
$$;

-- Function: update_client_seed
CREATE OR REPLACE FUNCTION update_client_seed(
    p_user_id UUID,
    p_new_client_seed TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF length(p_new_client_seed) < 1 OR length(p_new_client_seed) > 64 THEN
        RAISE EXCEPTION 'Client seed must be 1-64 characters';
    END IF;
    
    PERFORM initialize_user_seeds(p_user_id);
    
    UPDATE dice_seeds 
    SET client_seed = p_new_client_seed, updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'client_seed', p_new_client_seed
    );
END;
$$;

-- Function: get_user_dice_seeds
CREATE OR REPLACE FUNCTION get_user_dice_seeds(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seeds RECORD;
BEGIN
    PERFORM initialize_user_seeds(p_user_id);
    
    SELECT client_seed, server_seed_hash, nonce
    INTO v_seeds
    FROM dice_seeds WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
        'client_seed', v_seeds.client_seed,
        'server_seed_hash', v_seeds.server_seed_hash,
        'nonce', v_seeds.nonce
    );
END;
$$;
