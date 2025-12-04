import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowDownLeft, ArrowUpRight, Dices, DollarSign } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function Transactions() {
    const [page, setPage] = useState(0);
    const [type, setType] = useState('all');
    const [userSearch, setUserSearch] = useState('');
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin', 'transactions', page, type, userSearch],
        queryFn: async () => {
            let query = supabase
                .from('transactions')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

            if (type !== 'all') {
                query = query.eq('type', type);
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
                    return { transactions: [], count: 0 };
                }
            }

            const { data: txData, count, error } = await query;
            if (error) throw error;

            if (!txData || txData.length === 0) {
                return { transactions: [], count: count || 0 };
            }

            // Fetch profiles
            const userIds = [...new Set(txData.map((t: any) => t.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username')
                .in('id', userIds);

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const transactions = txData.map((t: any) => ({
                ...t,
                profiles: profilesMap.get(t.user_id)
            }));

            return { transactions: transactions as Transaction[], count: count || 0 };
        },
    });

    const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

    const getTypeIcon = (txType: string) => {
        switch (txType) {
            case 'deposit':
                return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
            case 'withdrawal':
                return <ArrowUpRight className="h-4 w-4 text-red-500" />;
            case 'bet':
                return <Dices className="h-4 w-4 text-yellow-500" />;
            case 'payout':
                return <DollarSign className="h-4 w-4 text-green-500" />;
            default:
                return <DollarSign className="h-4 w-4 text-gray-500" />;
        }
    };

    const getTypeBadgeClass = (txType: string) => {
        switch (txType) {
            case 'deposit':
            case 'payout':
                return 'bg-green-500/10 text-green-500 border-green-500';
            case 'withdrawal':
            case 'bet':
                return 'bg-red-500/10 text-red-500 border-red-500';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">Transactions</h1>
                <Badge variant="outline" className="text-muted-foreground">
                    {data?.count || 0} total transactions
                </Badge>
            </div>

            {/* Filters */}
            <Card className="bg-admin-surface border-admin-border p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search user..."
                            className="pl-8 bg-black/30 border-admin-border"
                            value={userSearch}
                            onChange={(e) => { setUserSearch(e.target.value); setPage(0); }}
                        />
                    </div>

                    <Select value={type} onValueChange={(v) => { setType(v); setPage(0); }}>
                        <SelectTrigger className="bg-black/30 border-admin-border">
                            <SelectValue placeholder="Transaction Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-admin-surface border-admin-border">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="deposit">Deposit</SelectItem>
                            <SelectItem value="withdrawal">Withdrawal</SelectItem>
                            <SelectItem value="bet">Bet</SelectItem>
                            <SelectItem value="payout">Payout</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="border-admin-border"
                        onClick={() => {
                            setType('all');
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
                            <TableHead>Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Meta</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-admin-border">
                                    <TableCell colSpan={5}>
                                        <Skeleton className="h-8 w-full bg-white/5" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : data?.transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            data?.transactions.map((tx) => (
                                <TableRow
                                    key={tx.id}
                                    className="border-admin-border hover:bg-white/5 cursor-pointer"
                                    onClick={() => { setSelectedTx(tx); setIsSheetOpen(true); }}
                                >
                                    <TableCell className="font-medium text-white">
                                        {tx.profiles?.username || 'Unknown'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(tx.type)}
                                            <Badge variant="outline" className={getTypeBadgeClass(tx.type)}>
                                                {tx.type}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className={`font-mono font-bold ${tx.amount_credits >= 0 ? 'text-green-500' : 'text-red-500'
                                        }`}>
                                        {tx.amount_credits >= 0 ? '+' : ''}{tx.amount_credits.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground font-mono">
                                        {tx.meta ? JSON.stringify(tx.meta).substring(0, 50) + '...' : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(tx.created_at).toLocaleString()}
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
                        <SheetTitle className="text-white">Transaction Details</SheetTitle>
                        <SheetDescription>Complete information for this transaction</SheetDescription>
                    </SheetHeader>
                    {selectedTx && (
                        <div className="mt-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-lg bg-black/30 border border-admin-border">
                                    <div className="text-xs text-muted-foreground mb-1">Transaction ID</div>
                                    <div className="text-xs font-mono break-all">{selectedTx.id}</div>
                                </div>
                                <div className="p-4 rounded-lg bg-black/30 border border-admin-border">
                                    <div className="text-xs text-muted-foreground mb-1">User</div>
                                    <div className="text-sm font-medium">{selectedTx.profiles?.username}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-sm font-bold border-b border-admin-border pb-2">Transaction Info</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between p-2 bg-white/5 rounded">
                                        <span className="text-muted-foreground">Type</span>
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(selectedTx.type)}
                                            <Badge variant="outline" className={getTypeBadgeClass(selectedTx.type)}>
                                                {selectedTx.type}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex justify-between p-2 bg-white/5 rounded">
                                        <span className="text-muted-foreground">Amount</span>
                                        <span className={`font-mono font-bold ${selectedTx.amount_credits >= 0 ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                            {selectedTx.amount_credits >= 0 ? '+' : ''}{selectedTx.amount_credits.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedTx.meta && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold border-b border-admin-border pb-2">Metadata</h4>
                                    <pre className="p-3 bg-black/50 rounded border border-admin-border text-xs overflow-auto max-h-64">
                                        {JSON.stringify(selectedTx.meta, null, 2)}
                                    </pre>
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                                Created: {new Date(selectedTx.created_at).toLocaleString()}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
