import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Bet } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { BetDetailModal } from '@/components/bets/BetDetailModal';

const ITEMS_PER_PAGE = 20;

export default function CasinoBets() {
    const [page, setPage] = useState(0);
    const [gameType, setGameType] = useState('all');
    const [result, setResult] = useState('all');
    const [userSearch, setUserSearch] = useState('');
    const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'casino-bets', page, gameType, result, userSearch],
        queryFn: async () => {
            let query = supabase
                .from('bets')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (gameType !== 'all') {
                query = query.eq('game_type', gameType);
            }

            if (result !== 'all') {
                query = query.eq('result', result);
            }

            if (userSearch) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id')
                    .or(`username.ilike.%${userSearch}%,id.eq.${userSearch}`);

                if (profiles && profiles.length > 0) {
                    const userIds = profiles.map(p => p.id);
                    query = query.in('user_id', userIds);
                } else {
                    return { bets: [], count: 0 };
                }
            }

            const { data: betsData, count, error } = await query;
            if (error) throw error;

            if (!betsData || betsData.length === 0) {
                return { bets: [], count: count || 0 };
            }

            // Fetch profiles for these bets
            const userIds = [...new Set(betsData.map((b: any) => b.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const bets = betsData.map((b: any) => ({
                ...b,
                profiles: profilesMap.get(b.user_id)
            }));

            return { bets: bets as Bet[], count: count || 0 };
        },
    });

    const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Casino Bets</h1>
                <Badge variant="outline" className="text-muted-foreground">
                    {data?.count || 0} total bets
                </Badge>
            </div>

            {/* Filters */}
            <Card className="bg-admin-surface border-admin-border p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search user..."
                            className="pl-8 bg-black/30 border-admin-border"
                            value={userSearch}
                            onChange={(e) => { setUserSearch(e.target.value); setPage(0); }}
                        />
                    </div>

                    <Select value={gameType} onValueChange={(v) => { setGameType(v); setPage(0); }}>
                        <SelectTrigger className="bg-black/30 border-admin-border">
                            <SelectValue placeholder="Game Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-surface border-admin-border">
                            <SelectItem value="all">All Games</SelectItem>
                            <SelectItem value="dice">Dice</SelectItem>
                            <SelectItem value="coinflip">Coin Flip</SelectItem>
                            <SelectItem value="mines">Mines</SelectItem>
                            <SelectItem value="plinko">Plinko</SelectItem>
                            <SelectItem value="crash">Crash</SelectItem>
                            <SelectItem value="blackjack">Blackjack</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={result} onValueChange={(v) => { setResult(v); setPage(0); }}>
                        <SelectTrigger className="bg-black/30 border-admin-border">
                            <SelectValue placeholder="Result" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-surface border-admin-border">
                            <SelectItem value="all">All Results</SelectItem>
                            <SelectItem value="win">Win</SelectItem>
                            <SelectItem value="loss">Loss</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="border-admin-border"
                        onClick={() => {
                            setGameType('all');
                            setResult('all');
                            setUserSearch('');
                            setPage(0);
                        }}
                    >
                        <Filter className="mr-2 h-4 w-4" />
                        Clear Filters
                    </Button>
                </div>
            </Card>

            {/* Table */}
            <Card className="bg-admin-surface border-admin-border">
                <Table>
                    <TableHeader>
                        <TableRow className="border-admin-border hover:bg-transparent">
                            <TableHead>User</TableHead>
                            <TableHead>Game</TableHead>
                            <TableHead>Stake</TableHead>
                            <TableHead>Payout</TableHead>
                            <TableHead>Net</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-admin-border">
                                    <TableCell colSpan={7}>
                                        <Skeleton className="h-8 w-full bg-white/5" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : data?.bets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    No bets found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.bets.map((bet) => {
                                const net = bet.payout_credits - bet.stake_credits;
                                return (
                                    <TableRow
                                        key={bet.id}
                                        className="border-admin-border hover:bg-white/5 cursor-pointer"
                                        onClick={() => { setSelectedBet(bet); setIsModalOpen(true); }}
                                    >
                                        <TableCell className="font-medium text-white">
                                            {bet.profiles?.username || 'Unknown'}
                                        </TableCell>
                                        <TableCell className="capitalize">{bet.game_type}</TableCell>
                                        <TableCell className="font-mono text-red-400">
                                            {bet.stake_credits.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="font-mono text-green-400">
                                            {bet.payout_credits.toFixed(2)}
                                        </TableCell>
                                        <TableCell className={`font-mono font-bold ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {net >= 0 ? '+' : ''}{net.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    bet.result === 'win'
                                                        ? 'bg-green-500/10 text-green-500 border-green-500'
                                                        : bet.result === 'loss'
                                                            ? 'bg-red-500/10 text-red-500 border-red-500'
                                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
                                                }
                                            >
                                                {bet.result}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(bet.created_at).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-admin-border">
                        <div className="text-sm text-muted-foreground">
                            Page {page + 1} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="border-admin-border"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="border-admin-border"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Bet Detail Modal */}
            <BetDetailModal
                bet={selectedBet}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
