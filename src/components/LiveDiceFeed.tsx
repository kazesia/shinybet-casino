import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, TrendingDown, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DiceBet {
    id: string;
    user_id: string;
    wager: number;
    target: number;
    roll_result: number;
    multiplier: number;
    payout: number;
    won: boolean;
    created_at: string;
    profiles?: {
        username?: string;
    };
}

type FilterType = 'all' | 'big_wins' | 'my_bets' | 'wins' | 'losses';

export function LiveDiceFeed() {
    const { user } = useAuth();
    const [bets, setBets] = useState<DiceBet[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        // Fetch initial bets
        const fetchInitialBets = async () => {
            const { data, error } = await supabase
                .from('dice_bets')
                .select(`
          *,
          profiles:user_id (username)
        `)
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                setBets(data);
            }
        };

        fetchInitialBets();

        // Subscribe to new bets
        const channel = supabase
            .channel('public-dice-bets')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'dice_bets',
                    filter: 'is_public=eq.true',
                },
                async (payload) => {
                    // Fetch user profile for the new bet
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', payload.new.user_id)
                        .single();

                    const newBet = {
                        ...payload.new,
                        profiles: profileData,
                    } as DiceBet;

                    setBets((prev) => [newBet, ...prev].slice(0, 50));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filteredBets = bets.filter((bet) => {
        switch (filter) {
            case 'big_wins':
                return bet.won && bet.multiplier >= 10;
            case 'my_bets':
                return user && bet.user_id === user.id;
            case 'wins':
                return bet.won;
            case 'losses':
                return !bet.won;
            default:
                return true;
        }
    });

    const BetCard = ({ bet }: { bet: DiceBet }) => {
        const isMyBet = user && bet.user_id === user.id;
        const username = isMyBet ? 'You' : (bet.profiles?.username || 'Anonymous');

        return (
            <div
                className={`bg-[#0f212e] rounded-lg border ${bet.won ? 'border-green-500/30' : 'border-red-500/30'
                    } p-3 transition-all hover:border-opacity-60`}
            >
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#b1bad3]" />
                        <span className="text-sm font-medium text-white">{username}</span>
                        {isMyBet && (
                            <Badge variant="outline" className="text-xs border-[#1475e1] text-[#1475e1]">
                                You
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {bet.won ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <Badge
                            variant="outline"
                            className={`${bet.won ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                                }`}
                        >
                            {bet.won ? 'Win' : 'Loss'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                        <p className="text-[#b1bad3]">Wager</p>
                        <p className="font-bold text-white">${bet.wager.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[#b1bad3]">Target</p>
                        <p className="font-bold text-white">{bet.target.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-[#b1bad3]">Roll</p>
                        <p className={`font-bold ${bet.won ? 'text-green-500' : 'text-red-500'}`}>
                            {bet.roll_result.toFixed(2)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[#b1bad3]">Multiplier</p>
                        <p className="font-bold text-white">{bet.multiplier.toFixed(2)}x</p>
                    </div>
                </div>

                {bet.won && (
                    <div className="mt-2 pt-2 border-t border-[#2f4553]">
                        <p className="text-xs text-[#b1bad3]">Payout</p>
                        <p className="text-sm font-bold text-green-500">${bet.payout.toFixed(2)}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-[#1a2c38] rounded-lg border border-[#2f4553] p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Live Bets</h3>
                <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                    <SelectTrigger className="w-[140px] bg-[#0f212e] border-[#2f4553] text-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2c38] border-[#2f4553]">
                        <SelectItem value="all" className="text-white">All Bets</SelectItem>
                        <SelectItem value="big_wins" className="text-white">Big Wins (10x+)</SelectItem>
                        <SelectItem value="my_bets" className="text-white">My Bets</SelectItem>
                        <SelectItem value="wins" className="text-white">Wins Only</SelectItem>
                        <SelectItem value="losses" className="text-white">Losses Only</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredBets.length > 0 ? (
                    filteredBets.map((bet) => <BetCard key={bet.id} bet={bet} />)
                ) : (
                    <div className="text-center py-12">
                        <p className="text-[#b1bad3]">No bets to display</p>
                        <p className="text-sm text-[#b1bad3] mt-2">
                            {filter !== 'all' ? 'Try changing the filter' : 'Waiting for bets...'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
