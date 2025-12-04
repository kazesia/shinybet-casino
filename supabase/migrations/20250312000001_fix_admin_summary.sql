-- Fix admin_summary function to work with actual schema
-- The profiles table doesn't have last_sign_in_at column

DROP FUNCTION IF EXISTS admin_summary();

CREATE OR REPLACE FUNCTION admin_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT count(*) FROM profiles),
        'active_users_24h', (SELECT count(*) FROM profiles WHERE created_at > now() - interval '24 hours'),
        'total_deposits', (SELECT COALESCE(sum(amount_credits), 0) FROM deposits WHERE status IN ('confirmed', 'credited')),
        'total_withdrawals', (SELECT COALESCE(sum(amount_credits), 0) FROM withdrawals WHERE status = 'paid'),
        'total_wagered', (SELECT COALESCE(sum(stake_credits), 0) FROM bets),
        'house_edge_profit', (SELECT COALESCE(sum(stake_credits * 0.01), 0) FROM bets),
        'net_profit', (
            (SELECT COALESCE(sum(stake_credits), 0) FROM bets) - 
            (SELECT COALESCE(sum(payout_credits), 0) FROM bets)
        )
    ) INTO result;

    RETURN result;
END;
$$;
