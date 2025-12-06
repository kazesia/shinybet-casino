import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  { name: 'Bronze', minWager: 0, color: '#cd7f32' },
  { name: 'Silver', minWager: 10000, color: '#c0c0c0' },
  { name: 'Gold', minWager: 50000, color: '#ffd700' },
  { name: 'Platinum', minWager: 100000, color: '#e5e4e2' },
  { name: 'Diamond', minWager: 500000, color: '#b9f2ff' },
];

// Format large numbers - only abbreviate billions and trillions
const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000_000) {
    return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface StatisticsModalProps {
  // For viewing another user's stats (optional)
  externalUserId?: string | null;
  externalUsername?: string;
  isExternalOpen?: boolean;
  onExternalClose?: () => void;
}

export function StatisticsModal({
  externalUserId,
  externalUsername,
  isExternalOpen,
  onExternalClose
}: StatisticsModalProps = {}) {
  const { isStatsModalOpen, closeStatsModal } = useUI();
  const { user, profile } = useAuth();

  // Determine if we're viewing external user or current user
  const isExternalMode = externalUserId !== undefined && externalUserId !== null;
  const isOpen = isExternalMode ? (isExternalOpen ?? false) : isStatsModalOpen;
  const targetUserId = isExternalMode ? externalUserId : user?.id;

  const [targetProfile, setTargetProfile] = useState<{ username: string; created_at: string } | null>(null);
  const [stats, setStats] = useState({
    totalBets: 0,
    wins: 0,
    losses: 0,
    wagered: 0
  });
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (isExternalMode && onExternalClose) {
      onExternalClose();
    } else {
      closeStatsModal();
    }
  };

  useEffect(() => {
    if (isOpen && targetUserId) {
      fetchStats();
    }
  }, [isOpen, targetUserId]);

  const fetchStats = async () => {
    if (!targetUserId) return;

    setLoading(true);
    try {
      // If external mode, fetch the target user's profile
      if (isExternalMode) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, created_at')
          .eq('id', targetUserId)
          .single();
        setTargetProfile(profileData);
      }

      // 1. Get Wagered Amount from RPC (Most accurate for VIP)
      const { data: userStats } = await supabase.rpc('get_user_stats', { user_id: targetUserId });

      // 2. Get Counts directly from bets table
      const { count: totalBets } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      const { count: wins } = await supabase
        .from('bets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
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

  // Determine display values based on mode
  const displayUsername = isExternalMode
    ? (targetProfile?.username || externalUsername || 'User')
    : (profile?.username || 'User');

  const displayJoinDate = isExternalMode
    ? (targetProfile?.created_at ? format(new Date(targetProfile.created_at), 'MMMM d, yyyy') : 'Unknown')
    : (user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'Unknown');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a2c38] border-[#2f4553] text-white p-0 gap-0 overflow-hidden shadow-2xl [&>button]:hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2f4553]">
          <div className="flex items-center gap-2">
            <img src="/icons/statistics.png" alt="Statistics" className="w-5 h-5 invert" />
            <h2 className="text-lg font-bold text-white">Statistics</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="text-[#b1bad3] hover:text-white hover:bg-[#2f4553] h-8 w-8 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">

          {/* User Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{displayUsername}</h2>
            </div>
            <p className="text-sm text-[#b1bad3]">Joined on {displayJoinDate}</p>
          </div>

          <div className="p-2 bg-[#213743] rounded-lg w-fit">
            <Star className="w-5 h-5 text-[#b17827]" />
          </div>

          {/* VIP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-white">{isExternalMode ? 'VIP Progress' : 'Your VIP Progress'}</span>
              <span className="font-bold text-white">{progressPercent.toFixed(2)}%</span>
            </div>

            <div className="relative h-2 bg-[#0f212e] rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%`, backgroundColor: currentTier.color }}
              />
            </div>

            <div className="flex justify-between text-xs font-medium">
              <span className="flex items-center gap-1" style={{ color: currentTier.color }}>
                <Star className="w-3 h-3" fill={currentTier.color} /> {currentTier.name}
              </span>
              <span className="flex items-center gap-1" style={{ color: nextTier?.color || currentTier.color }}>
                <Star className="w-3 h-3" fill={nextTier?.color || currentTier.color} /> {nextTier ? nextTier.name : 'Max'}
              </span>
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
                  {loading ? "..." : formatLargeNumber(stats.wagered)}
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
