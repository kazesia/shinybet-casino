import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { SportsBet } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function SportsBets() {
    const [page, setPage] = useState(0);
    const [sportKey, setSportKey] = useState('all');
    const [status, setStatus] = useState('all');
    const [userSearch, setUserSearch] = useState('');
    const [selectedBet, setSelectedBet] = useState<SportsBet | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'sports-bets', page, sportKey, status, userSearch],
        queryFn: async () => {
            let query = supabase
                .from('sports_bets')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (status !== 'all') {
                query = query.eq('status', status);
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

            // Fetch profiles and events
            const userIds = [...new Set(betsData.map((b: any) => b.user_id))];
            const eventIds = [...new Set(betsData.map((b: any) => b.event_id).filter(Boolean))];

            const [profilesRes, eventsRes] = await Promise.all([
                supabase.from('profiles').select('id, username').in('id', userIds),
                eventIds.length > 0
                    ? supabase.from('sports_events').select('*').in('id', eventIds)
                    : Promise.resolve({ data: [] })
            ]);

            const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
            const eventsMap = new Map(eventsRes.data?.map(e => [e.id, e]) || []);

            let bets = betsData.map((b: any) => ({
                ...b,
                profiles: profilesMap.get(b.user_id),
                sports_events: eventsMap.get(b.event_id)
            }));

            // Filter by sport_key on client side if needed (since it's in the event)
            if (sportKey !== 'all') {
                bets = bets.filter((bet: any) => bet.sports_events?.sport_key === sportKey);
            }

            return {
                bets: bets as SportsBet[],
                count: sportKey !== 'all' ? bets.length : (count || 0)
            };
        },
    });

    const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Sports Bets</h1>
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

                    <Select value={sportKey} onValueChange={(v) => { setSportKey(v); setPage(0); }}>
                        <SelectTrigger className="bg-black/30 border-admin-border">
                            <SelectValue placeholder="Sport" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-surface border-admin-border">
                            <SelectItem value="all">All Sports</SelectItem>
                            <SelectItem value="soccer">Soccer</SelectItem>
                            <SelectItem value="basketball">Basketball</SelectItem>
                            <SelectItem value="americanfootball">American Football</SelectItem>
                            <SelectItem value="baseball">Baseball</SelectItem>
                            <SelectItem value="icehockey">Ice Hockey</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
                        <SelectTrigger className="bg-black/30 border-admin-border">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-surface border-admin-border">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                            <SelectItem value="void">Void</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="border-admin-border"
                        onClick={() => {
                            setSportKey('all');
                            setStatus('all');
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
                            <TableHead>League</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Selection</TableHead>
                            <TableHead>Odds</TableHead>
                            <TableHead>Stake</TableHead>
                            <TableHead>Potential</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-admin-border">
                                    <TableCell colSpan={9}>
                                        <Skeleton className="h-8 w-full bg-white/5" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : data?.bets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                    No sports bets found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.bets.map((bet) => (
                                <TableRow
                                    key={bet.id}
                                    className="border-admin-border hover:bg-white/5 cursor-pointer"
                                    onClick={() => { setSelectedBet(bet); setIsSheetOpen(true); }}
                                >
                                    <TableCell className="font-medium text-white">
                                        {bet.profiles?.username || 'Unknown'}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {bet.sports_events?.sport_key?.replace('_', ' ') || 'N/A'}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {bet.sports_events
                                            ? `${bet.sports_events.home_team} vs ${bet.sports_events.away_team}`
                                            : 'Event deleted'}
                                    </TableCell>
                                    <TableCell className="text-sm">{bet.selection_name}</TableCell>
                                    <TableCell className="font-mono text-admin-accent">
                                        {bet.odds.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="font-mono text-red-400">
                                        {bet.stake.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="font-mono text-green-400">
                                        {bet.potential_payout.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={
                                                bet.status === 'won'
                                                    ? 'bg-green-500/10 text-green-500 border-green-500'
                                                    : bet.status === 'lost'
                                                        ? 'bg-red-500/10 text-red-500 border-red-500'
                                                        : bet.status === 'void'
                                                            ? 'bg-gray-500/10 text-gray-500 border-gray-500'
                                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
                                            }
                                        >
                                            {bet.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(bet.created_at).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))
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

            {/* Detail Sheet */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] bg-admin-surface border-l-admin-border text-white overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-white">Sports Bet Details</SheetTitle>
                        <SheetDescription>Complete information for this sports bet</SheetDescription>
                    </SheetHeader>
                    {selectedBet && (
                        <div className="mt-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-black/30 border border-admin-border">
                                    <div className="text-xs text-muted-foreground mb-1">Bet ID</div>
                                    <div className="text-xs font-mono break-all">{selectedBet.id}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-black/30 border border-admin-border">
                                    <div className="text-xs text-muted-foreground mb-1">User</div>
                                    <div className="text-sm font-medium">{selectedBet.profiles?.username}</div>
                                </div>
                            </div>

                            {selectedBet.sports_events && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold border-b border-admin-border pb-2">Event Info</h4>
                                    <div className="p-4 bg-black/30 border border-admin-border rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">League</span>
                                            <span className="font-medium capitalize">{selectedBet.sports_events.sport_key.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Home Team</span>
                                            <span className="font-medium">{selectedBet.sports_events.home_team}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Away Team</span>
                                            <span className="font-medium">{selectedBet.sports_events.away_team}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground text-sm">Commence Time</span>
                                            <span className="text-sm">{new Date(selectedBet.sports_events.commence_time).toLocaleString()}</span>
                                        </div>
                                        {selectedBet.sports_events.completed && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground text-sm">Score</span>
                                                <span className="font-medium">
                                                    {selectedBet.sports_events.home_score} - {selectedBet.sports_events.away_score}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold border-b border-admin-border pb-2">Bet Info</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between p-2 bg-white/5 rounded">
                                        <span className="text-muted-foreground">Selection</span>
                                        <span className="font-medium">{selectedBet.selection_name}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded">
                                        <span className="text-muted-foreground">Odds</span>
                                        <span className="font-mono text-admin-accent">{selectedBet.odds.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded">
                                        <span className="text-muted-foreground">Stake</span>
                                        <span className="font-mono text-red-400">{selectedBet.stake.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded">
                                        <span className="text-muted-foreground">Potential Payout</span>
                                        <span className="font-mono text-green-400">{selectedBet.potential_payout.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded col-span-2">
                                        <span className="text-muted-foreground">Status</span>
                                        <Badge variant="outline" className={
                                            selectedBet.status === 'won' ? 'border-green-500 text-green-500' :
                                                selectedBet.status === 'lost' ? 'border-red-500 text-red-500' :
                                                    selectedBet.status === 'void' ? 'border-gray-500 text-gray-500' :
                                                        'border-yellow-500 text-yellow-500'
                                        }>
                                            {selectedBet.status}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1">
                                <div>Created: {new Date(selectedBet.created_at).toLocaleString()}</div>
                                {selectedBet.settled_at && (
                                    <div>Settled: {new Date(selectedBet.settled_at).toLocaleString()}</div>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
