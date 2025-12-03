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

            let query = supabase
                .from('bets')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (gameType !== 'all') {
                query = query.eq('game_type', gameType);
            }

            const { data, count, error } = await query;

            if (error) throw error;

            return {
                bets: data as Bet[],
                count: count || 0
            };
        },
        enabled: !!user,
    });
};
