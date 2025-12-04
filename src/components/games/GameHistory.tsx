import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dices, Zap, Flame, TrendingUp, Spade, User as UserIcon, Trophy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bet } from '@/types';

interface GameHistoryProps {
    gameType: string;
}

const getGameIcon = (gameType: string) => {
    const type = gameType.toLowerCase();
    switch (type) {
        case 'dice':
            return <Dices className="w-4 h-4" />;
        case 'plinko':
            return <Zap className="w-4 h-4" />;
        case 'mines':
            return <Flame className="w-4 h-4" />;
        case 'crash':
            return <TrendingUp className="w-4 h-4" />;
        case 'blackjack':
            return <Spade className="w-4 h-4" />;
        case 'coinflip':
        case 'coin flip':
            return <UserIcon className="w-4 h-4" />;
        default:
            return <Dices className="w-4 h-4" />;
    }
};

export function GameHistory({ gameType }: GameHistoryProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'my' | 'all' | 'high'>('my');
    const [history, setHistory] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('bets')
                .select('*, profiles(username)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (activeTab === 'my' && user) {
                query = query.eq('user_id', user.id).eq('game_type', gameType);
            } else if (activeTab === 'all') {
                query = query.eq('game_type', gameType);
            } else if (activeTab === 'high') {
                query = query.eq('game_type', gameType).order('stake_credits', { ascending: false });
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching history:', error);
                throw error;
            }

            console.log(`Fetched ${gameType} history:`, data);
            setHistory((data as unknown as Bet[]) || []);
        } catch (error) {
            console.error('Error fetching history:', error);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user || activeTab !== 'my') {
            fetchHistory();
        }
    }, [user, activeTab, gameType]);

    // Subscribe to realtime updates
    useEffect(() => {
        const channel = supabase
            .channel(`${gameType}-bets`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'bets',
                filter: `game_type=eq.${gameType}`
            }, (payload) => {
                console.log('New bet received:', payload);
                fetchHistory();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [gameType, activeTab]);

    return (
        <Card className="bg-[#1a2c38] border-[#213743] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#213743]">
                <div className="flex items-center gap-2">
                    {getGameIcon(gameType)}
                    <h3 className="text-white font-bold">Recent Bets</h3>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('my')}
                        disabled={!user}
                        className={cn(
                            "text-xs font-bold transition-colors",
                            activeTab === 'my'
                                ? "bg-[#2f4553] text-white hover:bg-[#3d5565] hover:text-white"
                                : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                        )}
                    >
                        My Bets
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('all')}
                        className={cn(
                            "text-xs font-bold transition-colors",
                            activeTab === 'all'
                                ? "bg-[#2f4553] text-white hover:bg-[#3d5565] hover:text-white"
                                : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                        )}
                    >
                        All Bets
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveTab('high')}
                        className={cn(
                            "text-xs font-bold transition-colors flex items-center gap-1",
                            activeTab === 'high'
                                ? "bg-[#2f4553] text-white hover:bg-[#3d5565] hover:text-white"
                                : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                        )}
                    >
                        <Trophy className="w-3 h-3" />
                        High Rollers
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#b1bad3] bg-[#0f212e] uppercase">
                        <tr>
                            <th className="px-6 py-3">Game</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3 text-right">Bet Amount</th>
                            <th className="px-6 py-3 text-right">Multiplier</th>
                            <th className="px-6 py-3 text-right">Payout</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#b1bad3]" />
                                </td>
                            </tr>
                        ) : history.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-[#b1bad3]">
                                    No bets yet.
                                </td>
                            </tr>
                        ) : (
                            history.map((bet) => {
                                const multiplier = bet.stake_credits > 0 ? bet.payout_credits / bet.stake_credits : 0;
                                const isWin = bet.payout_credits > bet.stake_credits;

                                return (
                                    <tr key={bet.id} className="bg-[#1a2c38] border-b border-[#213743] hover:bg-[#213743] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 font-medium text-white">
                                                {getGameIcon(bet.game_type)}
                                                <span className="capitalize">{bet.game_type}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#b1bad3]">
                                            {bet.profiles?.username || user?.email?.split('@')[0] || 'Hidden'}
                                        </td>
                                        <td className="px-6 py-4 text-[#b1bad3] text-xs">
                                            {new Date(bet.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="px-6 py-4 text-right text-white font-mono">
                                            ${bet.stake_credits.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-[#b1bad3] font-mono">
                                            {multiplier.toFixed(2)}x
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 text-right font-bold font-mono",
                                            isWin ? "text-[#00e701]" : "text-[#b1bad3]"
                                        )}>
                                            {isWin ? `+$${bet.payout_credits.toFixed(2)}` : '$0.00'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
