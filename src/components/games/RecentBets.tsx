import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Dices, Zap, Flame, TrendingUp, Spade, User as UserIcon } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Bet {
    id: string;
    user_id: string;
    game_type: string;
    stake_credits: number;
    payout_credits: number;
    result: 'win' | 'loss' | 'pending';
    created_at: string;
    profiles?: {
        username: string;
    };
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

export function RecentBets() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [bets, setBets] = useState<Bet[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBets = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('bets')
                .select('*, profiles(username)')
                .order('created_at', { ascending: false })
                .limit(20);

            if (activeTab === 'my' && user) {
                query = query.eq('user_id', user.id);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching bets:', error);
                throw error;
            }

            logger.log('Fetched bets:', data);
            setBets(data || []);
        } catch (error) {
            console.error('Error fetching bets:', error);
            setBets([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBets();

        // Subscribe to realtime updates
        const channel = supabase
            .channel('public:bets')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets' }, (payload) => {
                logger.log('New bet received:', payload);
                fetchBets(); // Re-fetch to get profile data
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeTab, user]);

    return (
        <div className="mt-8 space-y-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="bg-[#0f212e] border border-[#2f4553]">
                        <TabsTrigger value="my" disabled={!user} className="data-[state=active]:bg-[#2f4553]">My Bets</TabsTrigger>
                        <TabsTrigger value="all" className="data-[state=active]:bg-[#2f4553]">All Bets</TabsTrigger>
                        <TabsTrigger value="high" disabled className="opacity-50 cursor-not-allowed">High Rollers</TabsTrigger>
                        <TabsTrigger value="race" disabled className="opacity-50 cursor-not-allowed">Race Leaderboard</TabsTrigger>
                    </TabsList>
                </div>

                <Card className="bg-[#1a2c38] border-[#2f4553] overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#2f4553] hover:bg-transparent">
                                <TableHead className="text-[#b1bad3]">Game</TableHead>
                                {activeTab === 'all' && <TableHead className="text-[#b1bad3]">User</TableHead>}
                                <TableHead className="text-[#b1bad3]">Time</TableHead>
                                <TableHead className="text-[#b1bad3] text-right">Bet Amount</TableHead>
                                <TableHead className="text-[#b1bad3] text-right">Multiplier</TableHead>
                                <TableHead className="text-[#b1bad3] text-right">Payout</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#b1bad3]" />
                                    </TableCell>
                                </TableRow>
                            ) : bets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-[#b1bad3]">
                                        No bets found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bets.map((bet) => {
                                    const multiplier = bet.stake_credits > 0 ? bet.payout_credits / bet.stake_credits : 0;
                                    const isWin = bet.payout_credits > bet.stake_credits;

                                    return (
                                        <TableRow key={bet.id} className="border-[#2f4553] hover:bg-[#213743]/50">
                                            <TableCell className="font-medium text-white">
                                                <div className="flex items-center gap-2">
                                                    {getGameIcon(bet.game_type)}
                                                    <span className="capitalize">{bet.game_type}</span>
                                                </div>
                                            </TableCell>
                                            {activeTab === 'all' && (
                                                <TableCell className="text-[#b1bad3]">
                                                    {bet.profiles?.username || 'Hidden'}
                                                </TableCell>
                                            )}
                                            <TableCell className="text-[#b1bad3] text-xs">
                                                {new Date(bet.created_at).toLocaleTimeString()}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-white">
                                                ${bet.stake_credits.toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-[#b1bad3]">
                                                {multiplier.toFixed(2)}x
                                            </TableCell>
                                            <TableCell className={`text-right font-mono ${isWin ? 'text-green-400' : 'text-[#b1bad3]'}`}>
                                                ${bet.payout_credits.toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </Tabs>
        </div>
    );
}
