import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bet } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dices, Gem, Bomb, Disc, Cherry, Coins, TrendingUp } from 'lucide-react';

const LiveBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [onlineCount, setOnlineCount] = useState(142); // Mock initial count

  useEffect(() => {
    // Initial fetch
    const fetchBets = async () => {
      const { data } = await supabase
        .from('bets')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(15);
      
      if (data) setBets(data as unknown as Bet[]);
    };

    fetchBets();

    // Realtime Subscription
    const subscription = supabase
      .channel('public:bets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets' }, async (payload) => {
        // Fetch the profile for the new bet
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', payload.new.user_id)
          .single();

        const newBet = { ...payload.new, profiles: profile } as unknown as Bet;
        
        setBets(prev => [newBet, ...prev].slice(0, 15));
        // Randomly fluctuate online count for liveliness
        setOnlineCount(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getGameIcon = (gameType: string) => {
    switch (gameType.toLowerCase()) {
      case 'dice': return <Dices className="w-3 h-3 text-blue-500" />;
      case 'mines': return <Bomb className="w-3 h-3 text-red-500" />;
      case 'slots': return <Cherry className="w-3 h-3 text-pink-500" />;
      case 'limbo': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'coinflip': return <Coins className="w-3 h-3 text-yellow-500" />;
      case 'wheel': return <Disc className="w-3 h-3 text-purple-500" />;
      default: return <Gem className="w-3 h-3 text-gold-gradient" />;
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-brand-success animate-pulse" />
          <h3 className="font-bold text-white">Live Bets</h3>
        </div>
        <Badge variant="outline" className="border-brand-success/30 text-brand-success bg-brand-success/10">
          {onlineCount} Online
        </Badge>
      </div>
      
      <ScrollArea className="h-[350px] w-full">
        <Table>
          <TableHeader className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-xs text-brand-textSecondary">Game</TableHead>
              <TableHead className="text-xs text-brand-textSecondary">User</TableHead>
              <TableHead className="text-xs text-brand-textSecondary text-right">Bet</TableHead>
              <TableHead className="text-xs text-brand-textSecondary text-right">Mult.</TableHead>
              <TableHead className="text-xs text-brand-textSecondary text-right">Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bets.map((bet) => {
              const multiplier = bet.payout_credits > 0 ? (bet.payout_credits / bet.stake_credits) : 0;
              const isWin = bet.result === 'win';

              return (
                <TableRow key={bet.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium text-sm flex items-center gap-2 capitalize text-white">
                     {getGameIcon(bet.game_type)}
                     {bet.game_type}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[80px] truncate">
                    {bet.profiles?.username || 'Anon'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-white">
                    {bet.stake_credits.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs ${isWin ? 'text-brand-textSecondary' : 'text-muted-foreground'}`}>
                    {multiplier.toFixed(2)}x
                  </TableCell>
                  <TableCell className={`text-right font-mono text-xs font-bold ${isWin ? 'text-brand-success' : 'text-brand-textSecondary'}`}>
                    {isWin ? bet.payout_credits.toFixed(2) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
            {bets.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Waiting for bets...
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default LiveBets;
