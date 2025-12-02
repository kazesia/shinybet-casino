import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bet } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export default function ActivityLogs() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGame, setFilterGame] = useState('all');
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchBets = async () => {
      setLoading(true);
      let query = supabase
        .from('bets')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filterGame !== 'all') {
        query = query.eq('game_type', filterGame);
      }

      const { data } = await query;
      if (data) setBets(data as unknown as Bet[]);
      setLoading(false);
    };

    fetchBets();
  }, [filterGame]);

  const toggleRow = (id: string) => {
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Betting History</h1>
        <div className="flex gap-4">
          <Select value={filterGame} onValueChange={setFilterGame}>
            <SelectTrigger className="w-[180px] bg-zinc-900/50 border-white/10">
              <SelectValue placeholder="Filter by Game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="Dice">Dice</SelectItem>
              <SelectItem value="CoinFlip">CoinFlip</SelectItem>
              <SelectItem value="Mines">Mines</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-white/5 bg-zinc-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>User</TableHead>
              <TableHead>Game</TableHead>
              <TableHead className="text-right">Stake</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead className="text-center">Result</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.map((bet) => (
              <>
                <TableRow key={bet.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => toggleRow(bet.id)}>
                      {openRows[bet.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{bet.profiles?.username}</TableCell>
                  <TableCell>{bet.game_type}</TableCell>
                  <TableCell className="text-right">{bet.stake_credits}</TableCell>
                  <TableCell className={`text-right font-bold ${bet.payout_credits > 0 ? 'text-brand-success' : ''}`}>
                    {bet.payout_credits}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={bet.result === 'win' ? 'border-brand-success text-brand-success' : 'border-brand-danger text-brand-danger'}>
                      {bet.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {new Date(bet.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
                {openRows[bet.id] && (
                  <TableRow className="bg-black/20 hover:bg-black/20 border-white/10">
                    <TableCell colSpan={7} className="p-4">
                      <div className="rounded bg-zinc-950 p-4 font-mono text-xs text-muted-foreground border border-white/5">
                        <pre>{JSON.stringify(bet, null, 2)}</pre>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
