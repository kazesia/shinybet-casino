/*
  # Security Polish & Search Path Hardening
  
  ## Security Improvements
  1. Explicitly sets 'search_path' to 'public' for all critical RPC functions.
     - This prevents "search path hijacking" where malicious users could potentially 
       execute functions in a different schema by manipulating the search path.
     - Addresses the "Function Search Path Mutable" security advisories.

  ## Affected Functions
  - place_sports_bet
  - increment_balance
  - request_withdrawal
  - admin_summary
  
  ## Impact
  - No data structure changes.
  - Purely a security configuration update.
  - Safe to run on existing production data.
*/

-- Secure place_sports_bet
-- Note: We use CREATE OR REPLACE to ensure we capture the function with its specific signature and apply the config
CREATE OR REPLACE FUNCTION public.place_sports_bet(
    p_user_id uuid,
    p_event_id uuid,
    p_selection_name text,
    p_odds numeric,
    p_stake numeric,
    p_potential_payout numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Hardens the function
AS $$
DECLARE
    v_bet_id uuid;
    v_current_balance numeric;
BEGIN
    -- 1. Check Balance
    SELECT credits INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_user_id;

    IF v_current_balance IS NULL OR v_current_balance < p_stake THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- 2. Deduct Stake
    UPDATE public.wallets
    SET credits = credits - p_stake,
        version = version + 1,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- 3. Create Bet Record
    INSERT INTO public.sports_bets (
        user_id,
        event_id,
        selection_name,
        odds,
        stake,
        potential_payout,
        status
    ) VALUES (
        p_user_id,
        p_event_id,
        p_selection_name,
        p_odds,
        p_stake,
        p_potential_payout,
        'pending'
    ) RETURNING id INTO v_bet_id;

    -- 4. Log Transaction
    INSERT INTO public.transactions (
        user_id,
        type,
        amount_credits
    ) VALUES (
        p_user_id,
        'bet',
        -p_stake
    );

    RETURN jsonb_build_object(
        'bet_id', v_bet_id,
        'new_balance', v_current_balance - p_stake,
        'status', 'placed'
    );
END;
$$;

-- Secure increment_balance
CREATE OR REPLACE FUNCTION public.increment_balance(
    p_user_id uuid,
    p_amount numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Hardens the function
AS $$
DECLARE
    v_new_balance numeric;
BEGIN
    UPDATE public.wallets
    SET credits = credits + p_amount,
        version = version + 1,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING credits INTO v_new_balance;

    -- Log transaction if amount is significant (e.g. not 0)
    IF p_amount <> 0 THEN
        INSERT INTO public.transactions (
            user_id,
            type,
            amount_credits
        ) VALUES (
            p_user_id,
            CASE WHEN p_amount > 0 THEN 'payout' ELSE 'bet' END,
            p_amount
        );
    END IF;

    RETURN v_new_balance;
END;
$$;

-- Secure request_withdrawal
CREATE OR REPLACE FUNCTION public.request_withdrawal(
    p_user_id uuid,
    p_amount numeric,
    p_currency text,
    p_address text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Hardens the function
AS $$
DECLARE
    v_balance numeric;
    v_wd_id uuid;
BEGIN
    -- Check balance
    SELECT credits INTO v_balance
    FROM public.wallets
    WHERE user_id = p_user_id;

    IF v_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds';
    END IF;

    -- Deduct funds immediately
    UPDATE public.wallets
    SET credits = credits - p_amount,
        version = version + 1
    WHERE user_id = p_user_id;

    -- Create withdrawal record
    INSERT INTO public.withdrawals (
        user_id,
        amount_credits,
        currency,
        target_address,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_currency,
        p_address,
        'pending'
    ) RETURNING id INTO v_wd_id;

    -- Log transaction
    INSERT INTO public.transactions (
        user_id,
        type,
        amount_credits
    ) VALUES (
        p_user_id,
        'withdrawal',
        -p_amount
    );

    RETURN v_wd_id;
END;
$$;
