import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Bet } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dices, Bomb, Coins, TrendingUp, Gamepad2, Spade, Zap, Ghost, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useViewport } from '@/hooks/useViewport';

const CRYPTO_CURRENCIES = [
  { code: 'BTC', icon: '₿', color: 'bg-orange-500' },
  { code: 'ETH', icon: 'Ξ', color: 'bg-blue-600' },
  { code: 'SOL', icon: '◎', color: 'bg-purple-500' },
  { code: 'LTC', icon: 'Ł', color: 'bg-gray-500' },
  { code: 'USDT', icon: '₮', color: 'bg-green-500' },
];

const GAMES = [
  { type: 'Dice', icon: Dices, color: 'text-blue-400', emoji: '🎲' },
  { type: 'Mines', icon: Bomb, color: 'text-red-400', emoji: '💣' },
  { type: 'CoinFlip', icon: Coins, color: 'text-yellow-400', emoji: '🪙' },
  { type: 'Crash', icon: TrendingUp, color: 'text-green-400', emoji: '📈' },
  { type: 'Plinko', icon: Zap, color: 'text-pink-400', emoji: '⚡' },
  { type: 'Blackjack', icon: Spade, color: 'text-purple-400', emoji: '♠️' },
  { type: 'Limbo', icon: TrendingUp, color: 'text-cyan-400', emoji: '🚀' },
  { type: 'Roulette', icon: Gamepad2, color: 'text-orange-400', emoji: '🎮' },
];

// --- Helper Components ---

const CryptoIcon = ({ currency }: { currency: typeof CRYPTO_CURRENCIES[0] }) => (
  <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-[#00e701]">
    $
  </div>
);

const GameIcon = ({ type }: { type: string }) => {
  const normalizedType = type.toLowerCase().replace(' ', '');
  let src = '';

  switch (normalizedType) {
    case 'dice':
      src = '/game-assets/thumbnails/dice_new.png';
      break;
    case 'plinko':
      src = '/game-assets/thumbnails/plinko_new.jpg';
      break;
    case 'mines':
      src = '/game-assets/thumbnails/mines_new.jpg';
      break;
    case 'crash':
      src = '/game-assets/thumbnails/crash_new.jpg';
      break;
    case 'blackjack':
      src = '/game-assets/thumbnails/blackjack_new.jpg';
      break;
    case 'coinflip':
    case 'flip':
      src = '/game-assets/thumbnails/flip.png';
      break;
    default:
      // Fallback to emoji if no image
      const game = GAMES.find(g => g.type.toLowerCase() === type.toLowerCase()) || GAMES[0];
      return <span className="text-lg">{game.emoji}</span>;
  }

  return (
    <img
      src={src}
      alt={type}
      className="w-5 h-5 rounded-md object-cover shadow-sm"
    />
  );
};

// Extended Bet type for UI display
interface DisplayBet extends Bet {
  isReal: boolean;
  currency?: typeof CRYPTO_CURRENCIES[0];
  isHidden?: boolean;
}

type TabType = 'all' | 'my' | 'high' | 'race';

export default function RecentBets() {
  const { user } = useAuth();
  const [bets, setBets] = useState<DisplayBet[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [limit, setLimit] = useState(20);
  const tableRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useViewport();

  // --- 1. Fetch Real History Initial Load ---
  const fetchInitialBets = async () => {
    try {
      let query = supabase
        .from('bets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter based on active tab
      if (activeTab === 'my' && user) {
        query = query.eq('user_id', user.id);
      } else if (activeTab === 'high') {
        query = query.or('stake_credits.gte.100,payout_credits.gte.500');
      }

      const { data: betsData, error } = await query;

      if (error) throw error;

      if (betsData && betsData.length > 0) {
        // Fetch profiles for these bets
        const userIds = [...new Set(betsData.map(b => b.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

        const realBets = betsData.map(b => ({
          ...b,
          profiles: profilesMap.get(b.user_id),
          isReal: true,
          currency: CRYPTO_CURRENCIES[3], // Default to LTC for real bets if not specified
          isHidden: false
        })) as unknown as DisplayBet[];

        setBets(realBets);
      } else {
        setBets([]);
      }
    } catch (err) {
      console.error('Error fetching recent bets:', err);
    }
  };

  // --- 2. Realtime Subscription ---
  useEffect(() => {
    fetchInitialBets();

    // Only subscribe to all bets if on "all" or "high" tab
    if (activeTab === 'all' || activeTab === 'high') {
      const subscription = supabase
        .channel('public:bets')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets' }, async (payload) => {
          // Fetch profile for the new bet
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          const newBet = {
            ...payload.new,
            profiles: profile || { username: 'Hidden' },
            isReal: true,
            currency: CRYPTO_CURRENCIES[3],
            isHidden: false
          } as unknown as DisplayBet;

          // Filter for high rollers if on that tab
          if (activeTab === 'high') {
            if (newBet.stake_credits >= 100 || newBet.payout_credits >= 500) {
              addBet(newBet);
            }
          } else {
            addBet(newBet);
          }
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeTab, limit, user]);

  const addBet = (newBet: DisplayBet) => {
    setBets(prev => {
      const updated = [newBet, ...prev];
      if (updated.length > limit) updated.pop();
      return updated;
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const filteredBets = bets;

  return (
    <div className="w-full bg-[#1a2c38] rounded-xl border border-[#2f4553] overflow-hidden shadow-xl flex flex-col">
      {/* Header with Tabs */}
      <div className="p-3 border-b border-[#2f4553] bg-[#0f212e]">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-[#1a2c38] p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('my')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-bold transition-all",
                activeTab === 'my'
                  ? "bg-[#2f4553] text-white"
                  : "text-[#b1bad3] hover:text-white"
              )}
            >
              My Bets
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-bold transition-all",
                activeTab === 'all'
                  ? "bg-[#2f4553] text-white"
                  : "text-[#b1bad3] hover:text-white"
              )}
            >
              All Bets
            </button>
            <button
              onClick={() => setActiveTab('high')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-bold transition-all",
                activeTab === 'high'
                  ? "bg-[#2f4553] text-white"
                  : "text-[#b1bad3] hover:text-white"
              )}
            >
              High Rollers
            </button>
            <button
              onClick={() => setActiveTab('race')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-bold transition-all",
                activeTab === 'race'
                  ? "bg-[#2f4553] text-white"
                  : "text-[#b1bad3] hover:text-white"
              )}
            >
              Race Leaderboard
            </button>
          </div>

          {/* Settings & Limit Selector */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#b1bad3] hover:text-white hover:bg-[#2f4553] rounded-lg">
              <Settings className="w-4 h-4" />
            </Button>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="bg-[#1a2c38] border border-[#2f4553] text-white text-sm font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#b1bad3] cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile View (Cards) */}
      {isMobile && (
        <div className="flex flex-col gap-2 p-4 md:hidden">
          {filteredBets.length === 0 ? (
            <div className="text-center py-8 text-[#b1bad3]">
              <div className="flex flex-col items-center gap-2">
                <Gamepad2 className="w-8 h-8 opacity-20" />
                <span>{activeTab === 'my' ? 'No bets yet.' : 'Connecting...'}</span>
              </div>
            </div>
          ) : (
            filteredBets.map((bet) => {
              const multiplier = bet.payout_credits > 0 ? (bet.payout_credits / bet.stake_credits) : 0;
              const isWin = bet.result === 'win';
              const currency = bet.currency || CRYPTO_CURRENCIES[3];

              return (
                <div key={bet.id} className="bg-[#0f212e] border border-[#2f4553] rounded-lg p-3 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#213743] flex items-center justify-center text-[#b1bad3]">
                      <GameIcon type={bet.game_type} />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white capitalize">{bet.game_type}</span>
                        <span className="text-xs text-[#b1bad3]">• {bet.profiles?.username || 'Hidden'}</span>
                      </div>
                      <span className="text-xs text-[#b1bad3]">{formatTime(bet.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className={cn(
                      "font-bold font-mono text-sm flex items-center gap-1",
                      isWin ? "text-[#00e701]" : "text-[#b1bad3]"
                    )}>
                      {isWin ? '+' : '-'}${isWin ? bet.payout_credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : bet.stake_credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <CryptoIcon currency={currency} />
                    </div>
                    <div className="text-xs text-[#b1bad3] font-mono">
                      {multiplier > 0 ? `${multiplier.toFixed(2)}x` : '0.00x'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table (Desktop) */}
      <div className="w-full overflow-hidden hidden md:block" ref={tableRef}>
        <Table>
          <TableHeader className="bg-[#0f212e]">
            <TableRow className="border-[#2f4553] hover:bg-transparent">
              <TableHead className="text-[#b1bad3] font-medium text-xs uppercase">Game</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-xs uppercase hidden md:table-cell">User</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-xs uppercase hidden sm:table-cell">Time</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-xs uppercase text-right">Bet Amount</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-xs uppercase text-right hidden lg:table-cell">Multiplier</TableHead>
              <TableHead className="text-[#b1bad3] font-medium text-xs uppercase text-right">Payout</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-[#1a2c38]">
            {activeTab === 'race' ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-[#b1bad3]">
                  <div className="flex flex-col items-center gap-2">
                    <Gamepad2 className="w-8 h-8 opacity-20" />
                    <span>Race Leaderboard coming soon!</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredBets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-[#b1bad3]">
                  <div className="flex flex-col items-center gap-2">
                    <Gamepad2 className="w-8 h-8 opacity-20" />
                    <span>{activeTab === 'my' ? 'No bets yet. Start playing!' : 'Connecting to live feed...'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredBets.map((bet) => {
                const multiplier = bet.payout_credits > 0 ? (bet.payout_credits / bet.stake_credits) : 0;
                const isWin = bet.result === 'win';
                const isLoss = bet.result === 'loss';
                const currency = bet.currency || CRYPTO_CURRENCIES[3];

                return (
                  <TableRow
                    key={bet.id}
                    className="border-[#2f4553] hover:bg-[#213743] transition-colors"
                  >
                    {/* Game Column */}
                    <TableCell className="font-medium text-white py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6">
                          <GameIcon type={bet.game_type} />
                        </div>
                        <span className="capitalize text-sm font-bold text-white">{bet.game_type}</span>
                      </div>
                    </TableCell>

                    {/* User Column */}
                    <TableCell className="text-[#b1bad3] text-sm font-medium hidden md:table-cell">
                      {bet.isHidden ? (
                        <span className="italic opacity-50">🙈 Hidden</span>
                      ) : (
                        bet.profiles?.username || 'Hidden'
                      )}
                    </TableCell>

                    {/* Time Column */}
                    <TableCell className="text-[#b1bad3] text-sm hidden sm:table-cell">
                      {formatTime(bet.created_at)}
                    </TableCell>

                    {/* Bet Amount Column */}
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-white font-medium text-sm">
                          ${bet.stake_credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <CryptoIcon currency={currency} />
                      </div>
                    </TableCell>

                    {/* Multiplier Column */}
                    <TableCell className="text-right hidden lg:table-cell py-3">
                      <span className="text-[#b1bad3] font-medium text-sm">
                        {multiplier > 0 ? `${multiplier.toFixed(2)}×` : '0.00×'}
                      </span>
                    </TableCell>

                    {/* Payout Column */}
                    <TableCell className="text-right py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className={cn(
                          "font-bold text-sm",
                          isWin ? "text-[#00e701]" : isLoss ? "text-red-500" : "text-[#b1bad3]"
                        )}>
                          {isWin ? `+$${bet.payout_credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : isLoss ? `-$${bet.stake_credits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                        </span>
                        <CryptoIcon currency={currency} />
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
