import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Bet } from '@/types';

export const useBets = (gameType = 'all', page = 0, pageSize = 10) => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['bets', user?.id, gameType, page, pageSize],
        queryFn: async () => {
            if (!user) return { bets: [], count: 0 };

            // Handle Sports Bets
            if (gameType === 'sports') {
                const { data, count, error } = await supabase
                    .from('sports_bets')
                    .select('*', { count: 'exact' })
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                if (error) throw error;

                const mappedBets: Bet[] = (data || []).map((b: any) => ({
                    id: b.id,
                    user_id: b.user_id,
                    game_type: b.sport_key || 'Sports',
                    stake_credits: b.stake,
                    payout_credits: b.status === 'won' ? b.potential_payout : 0,
                    result: b.status === 'won' ? 'win' : b.status === 'lost' ? 'loss' : 'pending',
                    created_at: b.created_at,
                    provably_fair: null
                }));

                return {
                    bets: mappedBets,
                    count: count || 0
                };
            }

            // Handle Casino Bets (Default / 'all')
            let query = supabase
                .from('bets')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (gameType !== 'all' && gameType !== 'sports') {
                query = query.eq('game_type', gameType);
            }

            const { data, count, error } = await query;

            if (error) throw error;

            // Fetch usernames for the bets
            const betsWithUsernames = await Promise.all(
                (data || []).map(async (bet: any) => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', bet.user_id)
                        .single();

                    return {
                        ...bet,
                        display_username: profile?.username || `User${bet.user_id.substring(0, 4)}`
                    };
                })
            );

            return {
                bets: betsWithUsernames as Bet[],
                count: count || 0
            };
        },
        enabled: !!user,
    });
};
