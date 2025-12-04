import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface BetData {
    id: string;
    user_id: string;
    game_type: string;
    stake_credits: number;
    payout_credits: number;
    result: 'win' | 'loss' | 'pending';
    created_at: string;
    display_username?: string;
}

export type BetTab = 'my' | 'all' | 'high' | 'race';

interface UseRecentBetsOptions {
    tab: BetTab;
    pageSize?: number;
    gameFilter?: string;
    searchQuery?: string;
    timeFilter?: string;
}

export function useRecentBets({
    tab,
    pageSize = 20,
    gameFilter,
    searchQuery,
    timeFilter
}: UseRecentBetsOptions) {
    const { user, profile } = useAuth();
    const [bets, setBets] = useState<BetData[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    const fetchBets = useCallback(async (pageNum: number = 0, append: boolean = false) => {
        try {
            setLoading(true);

            let query = supabase
                .from('bets')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(pageNum * pageSize, (pageNum + 1) * pageSize - 1);

            // Apply tab filters
            if (tab === 'my' && user) {
                query = query.eq('user_id', user.id);
            } else if (tab === 'high') {
                query = query.gte('stake_credits', 100);
            }

            // Apply game filter
            if (gameFilter && gameFilter !== 'all') {
                query = query.eq('game_type', gameFilter);
            }

            // Apply search filter (username or bet ID)
            if (searchQuery) {
                // For bet ID search
                if (searchQuery.length > 10) {
                    query = query.ilike('id', `%${searchQuery}%`);
                }
            }

            // Apply time filter
            if (timeFilter && timeFilter !== 'all') {
                const now = new Date();
                let startTime = new Date();

                switch (timeFilter) {
                    case '1h':
                        startTime.setHours(now.getHours() - 1);
                        break;
                    case '24h':
                        startTime.setHours(now.getHours() - 24);
                        break;
                    case '7d':
                        startTime.setDate(now.getDate() - 7);
                        break;
                }

                query = query.gte('created_at', startTime.toISOString());
            }

            const { data, error, count } = await query;

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

            if (append) {
                setBets(prev => [...prev, ...(betsWithUsernames as BetData[] || [])]);
            } else {
                setBets(betsWithUsernames as BetData[] || []);
            }

            setTotalCount(count || 0);
            setHasMore(data ? data.length === pageSize : false);
        } catch (error) {
            console.error('Error fetching bets:', error);
            toast.error('Failed to load bets');
        } finally {
            setLoading(false);
        }
    }, [tab, user, pageSize, gameFilter, searchQuery, timeFilter]);

    const loadMore = useCallback(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchBets(nextPage, true);
    }, [page, fetchBets]);

    const refresh = useCallback(() => {
        setPage(0);
        fetchBets(0, false);
    }, [fetchBets]);

    // Subscribe to realtime updates
    useEffect(() => {
        const channel = supabase
            .channel('public:bets')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'bets'
            }, (payload) => {
                const newBet = payload.new as BetData;

                // Check if bet matches current filters
                let shouldAdd = true;

                if (tab === 'my' && newBet.user_id !== user?.id) {
                    shouldAdd = false;
                }

                if (tab === 'high' && newBet.stake_credits < 100) {
                    shouldAdd = false;
                }

                if (gameFilter && gameFilter !== 'all' && newBet.game_type !== gameFilter) {
                    shouldAdd = false;
                }

                if (shouldAdd) {
                    // Fetch the complete bet
                    supabase
                        .from('bets')
                        .select('*')
                        .eq('id', newBet.id)
                        .single()
                        .then(async ({ data: betData }) => {
                            if (betData) {
                                // Fetch username
                                const { data: profile } = await supabase
                                    .from('profiles')
                                    .select('username')
                                    .eq('id', betData.user_id)
                                    .single();

                                const betWithUsername = {
                                    ...betData,
                                    display_username: profile?.username || `User${betData.user_id.substring(0, 4)}`
                                };

                                setBets(prev => {
                                    // Add to top and limit to pageSize
                                    const updated = [betWithUsername as BetData, ...prev];
                                    return updated.slice(0, pageSize);
                                });
                            }
                        });
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'bets'
            }, (payload) => {
                const updatedBet = payload.new as BetData;
                setBets(prev => prev.map(bet =>
                    bet.id === updatedBet.id ? { ...bet, ...updatedBet } : bet
                ));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tab, user, gameFilter, pageSize]);

    // Initial fetch
    useEffect(() => {
        setPage(0);
        fetchBets(0, false);
    }, [tab, gameFilter, searchQuery, timeFilter]);

    return {
        bets,
        loading,
        hasMore,
        totalCount,
        loadMore,
        refresh,
        isAdmin
    };
}
