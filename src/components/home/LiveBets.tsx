import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Bet } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dices, Bomb, Coins, TrendingUp, Gamepad2, Spade, Zap, Ghost, Bitcoin } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Configuration for Fake Data ---
// Normal names as requested
const NORMAL_NAMES = [
  'Alex', 'Sarah', 'Mike', 'David', 'Emma', 'Chris', 'James', 'Lisa', 'Tom', 'Anna',
  'Ryan', 'Kevin', 'Jessica', 'Daniel', 'Paul', 'Mark', 'Emily', 'Laura', 'Steve', 'Julie',
  'Brian', 'Amy', 'Jason', 'Scott', 'Eric', 'Justin', 'Melissa', 'Nicole', 'Matt', 'Amanda'
];

const CRYPTO_CURRENCIES = [
  { code: 'BTC', icon: '₿', color: 'bg-orange-500' },
  { code: 'ETH', icon: 'Ξ', color: 'bg-blue-600' },
  { code: 'SOL', icon: '◎', color: 'bg-purple-500' },
  { code: 'LTC', icon: 'Ł', color: 'bg-gray-500' },
  { code: 'USDT', icon: '₮', color: 'bg-green-500' },
];

const GAMES = [
  { type: 'Dice', icon: Dices, color: 'text-blue-400' },
  { type: 'Mines', icon: Bomb, color: 'text-red-400' },
  { type: 'CoinFlip', icon: Coins, color: 'text-yellow-400' },
  { type: 'Crash', icon: TrendingUp, color: 'text-green-400' },
  { type: 'Plinko', icon: Zap, color: 'text-pink-400' },
  { type: 'Blackjack', icon: Spade, color: 'text-purple-400' },
  { type: 'Limbo', icon: TrendingUp, color: 'text-cyan-400' },
  { type: 'Roulette', icon: Gamepad2, color: 'text-orange-400' },
];

// --- Helper Components ---

const CryptoIcon = ({ currency }: { currency: typeof CRYPTO_CURRENCIES[0] }) => (
  <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0", currency.color)}>
    {currency.icon}
  </div>
);

const GameIcon = ({ type }: { type: string }) => {
  const game = GAMES.find(g => g.type.toLowerCase() === type.toLowerCase()) || GAMES[0];
  const Icon = game.icon;
  return <Icon className={cn("w-4 h-4", game.color)} />;
};

// Extended Bet type for UI display
interface DisplayBet extends Bet {
  isReal: boolean;
  currency?: typeof CRYPTO_CURRENCIES[0];
  isHidden?: boolean;
}

export default function RecentBets() {
  const [bets, setBets] = useState<DisplayBet[]>([]);
  const [isLive, setIsLive] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);

  // --- 1. Fetch Real History Initial Load ---
  const fetchInitialBets = async () => {
    const { data } = await supabase
      .from('bets')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (data) {
      const realBets = data.map(b => ({
        ...b,
        isReal: true,
        currency: CRYPTO_CURRENCIES[3], // Default to LTC for real bets if not specified
        isHidden: false
      })) as unknown as DisplayBet[];
      setBets(realBets);
    }
  };

  // --- 2. Fake Bet Generator ---
  useEffect(() => {
    fetchInitialBets();

    // Realtime Subscription for REAL bets
    const subscription = supabase
      .channel('public:bets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets' }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', payload.new.user_id)
          .single();

        const newBet = { 
          ...payload.new, 
          profiles: profile || { username: 'Hidden' },
          isReal: true,
          currency: CRYPTO_CURRENCIES[3], // Default real bets to LTC for now
          isHidden: false
        } as unknown as DisplayBet;

        addBet(newBet);
      })
      .subscribe();

    // Fake Bet Interval
    const interval = setInterval(() => {
      if (!isLive) return;

      // Randomize Bet Data
      const game = GAMES[Math.floor(Math.random() * GAMES.length)];
      const currency = CRYPTO_CURRENCIES[Math.floor(Math.random() * CRYPTO_CURRENCIES.length)];
      
      // 95% Hidden Users
      const isHidden = Math.random() < 0.95;
      const username = isHidden ? 'Hidden' : NORMAL_NAMES[Math.floor(Math.random() * NORMAL_NAMES.length)];
      
      const isWin = Math.random() > 0.55; // 45% win rate
      const stake = parseFloat((Math.random() * (Math.random() > 0.95 ? 500 : 50)).toFixed(2)); 
      
      let multiplier = 0;
      if (isWin) {
        const rand = Math.random();
        if (rand > 0.98) multiplier = parseFloat((Math.random() * 100).toFixed(2));
        else if (rand > 0.9) multiplier = parseFloat((Math.random() * 10).toFixed(2));
        else multiplier = parseFloat((1 + Math.random() * 2).toFixed(2));
      }

      const payout = isWin ? stake * multiplier : 0;

      const fakeBet: DisplayBet = {
        id: `fake-${Date.now()}-${Math.random()}`,
        user_id: 'fake',
        game_type: game.type,
        profiles: { username },
        stake_credits: stake,
        payout_credits: payout,
        result: isWin ? 'win' : 'loss',
        created_at: new Date().toISOString(),
        isReal: false,
        currency: currency,
        isHidden: isHidden
      };

      addBet(fakeBet);

    }, 800); // New bet every 800ms

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [isLive]);

  const addBet = (newBet: DisplayBet) => {
    setBets(prev => {
      const updated = [newBet, ...prev];
      if (updated.length > 15) updated.pop(); // Keep list size constant
      return updated;
    });
  };

  return (
    <div className="w-full bg-[#1a2c38] rounded-xl border border-[#2f4553] overflow-hidden shadow-xl flex flex-col">
      <div className="p-4 border-b border-[#2f4553] flex items-center justify-between bg-[#0f212e]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-[#00e701] animate-pulse shadow-[0_0_8px_#00e701]" />
            <div className="absolute inset-0 rounded-full bg-[#00e701] animate-ping opacity-75" />
          </div>
          <h3 className="font-bold text-white text-sm uppercase tracking-wide">Live Bets</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#b1bad3] bg-[#1a2c38] px-3 py-1 rounded-full border border-[#2f4553]">
           <Ghost className="w-3 h-3" />
           <span>{Math.floor(Math.random() * 500) + 1500} Online</span>
        </div>
      </div>
      
      <div className="w-full overflow-hidden" ref={tableRef}>
        <Table>
          <TableHeader className="bg-[#0f212e]">
            <TableRow className="border-[#2f4553] hover:bg-transparent">
              <TableHead className="text-[#b1bad3] font-medium w-[200px]">Game</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-center hidden sm:table-cell">User</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-right">Bet Amount</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-right hidden sm:table-cell">Multiplier</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-right">Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-[#1a2c38]">
            {bets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-[#b1bad3]">
                  <div className="flex flex-col items-center gap-2">
                    <Gamepad2 className="w-8 h-8 opacity-20" />
                    <span>Connecting to live feed...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              bets.map((bet) => {
                const multiplier = bet.payout_credits > 0 ? (bet.payout_credits / bet.stake_credits) : 0;
                const isWin = bet.result === 'win';
                // High roller highlight
                const isHighRoller = bet.payout_credits > 1000 || bet.stake_credits > 500;
                const currency = bet.currency || CRYPTO_CURRENCIES[3];

                return (
                  <TableRow 
                    key={bet.id} 
                    className={cn(
                      "border-[#2f4553] transition-colors duration-300",
                      isHighRoller ? "bg-[#F7D979]/5 hover:bg-[#F7D979]/10" : "hover:bg-[#213743]"
                    )}
                  >
                    {/* Game Column */}
                    <TableCell className="font-medium text-white py-3">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-[#0f212e] border border-[#2f4553] group-hover:border-[#b1bad3]/30 transition-colors">
                           <GameIcon type={bet.game_type} />
                        </div>
                        <span className="capitalize text-sm font-bold hidden sm:inline-block">{bet.game_type}</span>
                      </div>
                    </TableCell>

                    {/* User Column */}
                    <TableCell className="text-center text-[#b1bad3] text-xs font-medium hidden sm:table-cell">
                      {bet.isHidden ? (
                        <span className="italic opacity-50">Hidden</span>
                      ) : (
                        bet.profiles?.username || 'Hidden'
                      )}
                    </TableCell>

                    {/* Bet Amount Column */}
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-white font-medium text-sm">
                          ${bet.stake_credits.toFixed(2)}
                        </span>
                        <CryptoIcon currency={currency} />
                      </div>
                    </TableCell>

                    {/* Multiplier Column */}
                    <TableCell className="text-right hidden sm:table-cell py-3">
                      <span className={cn(
                        "font-bold text-sm",
                        isWin ? "text-[#b1bad3]" : "text-[#b1bad3]/50"
                      )}>
                        {multiplier > 0 ? `${multiplier.toFixed(2)}×` : '-'}
                      </span>
                    </TableCell>

                    {/* Payout Column */}
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn(
                          "font-bold text-sm",
                          isWin ? "text-[#00e701] drop-shadow-[0_0_5px_rgba(0,231,1,0.2)]" : "text-[#b1bad3]/50"
                        )}>
                          {isWin ? `+$${bet.payout_credits.toFixed(2)}` : '$0.00'}
                        </span>
                        {isWin && <CryptoIcon currency={currency} />}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
