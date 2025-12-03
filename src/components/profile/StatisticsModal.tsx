import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Star, Info, Download, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// VIP Tiers Configuration (Shared logic)
const TIERS = [
  { name: 'Bronze', minWager: 0 },
  { name: 'Silver', minWager: 10000 },
  { name: 'Gold', minWager: 50000 },
  { name: 'Platinum', minWager: 100000 },
  { name: 'Diamond', minWager: 500000 },
];

export function StatisticsModal() {
  const { isStatsModalOpen, closeStatsModal } = useUI();
  const { user, profile } = useAuth();
  
  const [stats, setStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    wagered: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isStatsModalOpen && user) {
      fetchStats();
    }
  }, [isStatsModalOpen, user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // 1. Get Wagered Amount from RPC (Most accurate for VIP)
      const { data: userStats } = await supabase.rpc('get_user_stats', { user_id: user?.id });
      
      // 2. Get Counts directly from bets table
      // Note: In a real large-scale app, these counts should be incremented in a profile_stats table via triggers
      const { count: totalBets } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const { count: wins } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('result', 'win');

      const calculatedTotalBets = totalBets || 0;
      const calculatedWins = wins || 0;
      const calculatedLosses = calculatedTotalBets - calculatedWins;

      setStats({
        totalBets: calculatedTotalBets,
        wins: calculatedWins,
        losses: calculatedLosses,
        wagered: userStats?.total_wagered || 0
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // VIP Calculation
  const wagered = stats.wagered;
  const currentTierIndex = TIERS.slice().reverse().findIndex(t => wagered >= t.minWager);
  const actualIndex = currentTierIndex === -1 ? 0 : TIERS.length - 1 - currentTierIndex;
  const currentTier = TIERS[actualIndex];
  const nextTier = TIERS[actualIndex + 1];

  let progressPercent = 0;
  if (nextTier) {
    const totalNeeded = nextTier.minWager - currentTier.minWager;
    const currentProgress = wagered - currentTier.minWager;
    progressPercent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
  } else {
    progressPercent = 100;
  }

  const joinDate = user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown';

  return (
    <Dialog open={isStatsModalOpen} onOpenChange={(open) => !open && closeStatsModal()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a2c38] border-[#2f4553] text-white p-0 gap-0 overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f4553]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white" />
            <DialogTitle className="text-lg font-bold text-white">Statistics</DialogTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={closeStatsModal} className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-8 w-8 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* User Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{profile?.username || 'User'}</h2>
            </div>
            <p className="text-sm text-[#b1bad3]">Joined on {joinDate}</p>
          </div>

          <div className="p-2 bg-[#213743] rounded-lg w-fit">
             <Star className="w-5 h-5 text-[#b17827]" />
          </div>

          {/* VIP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-white">Your VIP Progress</span>
              <span className="font-bold text-white">{progressPercent.toFixed(2)}%</span>
            </div>
            
            <div className="relative h-2 bg-[#0f212e] rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-[#b17827] rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-medium text-[#b1bad3]">
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {currentTier.name}</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {nextTier ? nextTier.name : 'Max'}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[#b1bad3] font-medium">Type</label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2c38] border-[#2f4553] text-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="casino">Casino</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[#b1bad3] font-medium">Currency</label>
              <Select defaultValue="all">
                <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white h-10">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2c38] border-[#2f4553] text-white">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="btc">BTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f212e] p-4 rounded-lg border border-[#2f4553]">
              <div className="text-xs text-[#b1bad3] mb-1">Total Bets</div>
              <div className="text-xl font-bold text-white">
                {loading ? "..." : stats.totalBets.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#0f212e] p-4 rounded-lg border border-[#2f4553]">
              <div className="text-xs text-[#b1bad3] mb-1">Number of Wins</div>
              <div className="text-xl font-bold text-white">
                {loading ? "..." : stats.wins.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#0f212e] p-4 rounded-lg border border-[#2f4553]">
              <div className="text-xs text-[#b1bad3] mb-1">Number of Losses</div>
              <div className="text-xl font-bold text-white">
                {loading ? "..." : stats.losses.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#0f212e] p-4 rounded-lg border border-[#2f4553]">
              <div className="flex items-center gap-1 text-xs text-[#b1bad3] mb-1">
                Wagered <Info className="w-3 h-3" />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xl font-bold text-white">
                  ${loading ? "..." : stats.wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="w-5 h-5 rounded-full bg-[#00e701] flex items-center justify-center text-black font-bold text-xs">
                  $
                </div>
              </div>
            </div>
          </div>

          {/* Footer Button */}
          <Button className="w-full bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold h-12 gap-2">
            <Download className="w-4 h-4" /> Request statistics
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  );
}
