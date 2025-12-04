import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Deposit } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function Deposits() {
  const [currency, setCurrency] = useState('all');
  const [status, setStatus] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const { data: deposits, isLoading } = useQuery({
    queryKey: ['admin', 'deposits', currency, status, userSearch],
    queryFn: async () => {
      let query = supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (currency !== 'all') {
        query = query.eq('currency', currency);
      }

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
          return [];
        }
      }

      const { data: depositsData, error } = await query;
      if (error) throw error;

      if (!depositsData || depositsData.length === 0) return [];

      // Fetch profiles for these deposits
      const userIds = [...new Set(depositsData.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return depositsData.map((d: any) => ({
        ...d,
        profiles: profilesMap.get(d.user_id)
      })) as Deposit[];
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Deposits</h1>
        <Badge variant="outline" className="text-muted-foreground">
          {deposits?.length || 0} deposits
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
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>

          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="bg-black/30 border-admin-border">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Currencies</SelectItem>
              <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
              <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
              <SelectItem value="USDT">Tether (USDT)</SelectItem>
              <SelectItem value="LTC">Litecoin (LTC)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-black/30 border-admin-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-admin-surface border-admin-border">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="credited">Credited</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="border-admin-border"
            onClick={() => {
              setCurrency('all');
              setStatus('all');
              setUserSearch('');
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
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Amount Crypto</TableHead>
              <TableHead>Amount Credits</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Confirmations</TableHead>
              <TableHead>Tx Hash</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-admin-border">
                  <TableCell colSpan={8}>
                    <Skeleton className="h-8 w-full bg-white/5" />
                  </TableCell>
                </TableRow>
              ))
            ) : deposits?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No deposits found
                </TableCell>
              </TableRow>
            ) : (
              deposits?.map((deposit) => (
                <TableRow
                  key={deposit.id}
                  className="border-admin-border hover:bg-white/5 cursor-pointer"
                  onClick={() => { setSelectedDeposit(deposit); setIsSheetOpen(true); }}
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(deposit.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {deposit.profiles?.username || 'Unknown'}
                  </TableCell>
                  <TableCell className="font-bold">{deposit.currency}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {deposit.amount_crypto}
                  </TableCell>
                  <TableCell className="font-mono text-admin-accent font-bold">
                    {deposit.amount_credits.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        deposit.status === 'credited'
                          ? 'bg-green-500/10 text-green-500 border-green-500'
                          : deposit.status === 'confirmed'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500'
                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500'
                      }
                    >
                      {deposit.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {deposit.confirmations || 0}
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-[100px] truncate">
                    {deposit.tx_hash || 'Pending...'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] bg-admin-surface border-l-admin-border text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Deposit Details</SheetTitle>
            <SheetDescription>Transaction ID: {selectedDeposit?.id}</SheetDescription>
          </SheetHeader>

          {selectedDeposit && (
            <div className="mt-8 space-y-6">
              <div className="p-4 rounded-lg bg-black/30 border border-admin-border space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={
                    selectedDeposit.status === 'credited' ? 'bg-green-500' :
                      selectedDeposit.status === 'confirmed' ? 'bg-blue-500' :
                        'bg-yellow-500'
                  }>
                    {selectedDeposit.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">User</span>
                  <span className="font-bold">{selectedDeposit.profiles?.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-admin-accent text-lg">{selectedDeposit.amount_credits} Credits</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Blockchain Data</h4>
                <div className="p-4 rounded-lg bg-black/30 border border-admin-border space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-black/50 p-1 rounded flex-1 truncate font-mono">
                        {selectedDeposit.tx_hash || 'Pending...'}
                      </code>
                      {selectedDeposit.tx_hash && (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(selectedDeposit.tx_hash!)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {selectedDeposit.tx_hash && (
                    <Button variant="outline" className="w-full border-admin-border hover:bg-white/5 text-xs" onClick={() => window.open(`https://etherscan.io/tx/${selectedDeposit.tx_hash}`, '_blank')}>
                      <ExternalLink className="mr-2 h-3 w-3" /> View on Block Explorer
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">Raw Data</h4>
                <pre className="bg-black/50 p-4 rounded-lg border border-admin-border text-[10px] font-mono overflow-auto max-h-[200px] text-muted-foreground">
                  {JSON.stringify(selectedDeposit, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
