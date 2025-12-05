import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/context/AuthContext';
import { Info, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TIERS = [
    { name: 'Bronze', minWager: 0, color: 'text-[#b1bad3]' },
    { name: 'Silver', minWager: 10000, color: 'text-[#b1bad3]' },
    { name: 'Gold', minWager: 50000, color: 'text-[#F7D979]' },
    { name: 'Platinum', minWager: 100000, color: 'text-cyan-400' },
    { name: 'Diamond', minWager: 500000, color: 'text-purple-400' },
];

export default function VIPProgressCard() {
    const { stats } = useDashboardData();
    const { profile } = useAuth();

    const wagered = stats?.total_wagered || 0;
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

    return (
        <Link to="/vip-club" className="block h-full">
            <div className="bg-[#0f212e] border border-[#F7D979]/50 rounded-xl p-6 h-full flex flex-col justify-between relative overflow-hidden group transition-all hover:border-[#F7D979] hover:shadow-[0_0_20px_-10px_rgba(247,217,121,0.3)]">

                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg tracking-wide">
                            {profile?.username || 'User'}
                        </span>
                    </div>
                    <Star className="w-5 h-5 text-[#F7D979]" />
                </div>

                {/* Progress Info Row */}
                <div className="flex items-end justify-between mb-2">
                    <div className="flex items-center gap-1 text-[#b1bad3] group-hover:text-white transition-colors">
                        <span className="text-sm font-medium">Your VIP Progress</span>
                        <ChevronRight className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-white font-bold text-lg font-mono">
                            {progressPercent.toFixed(2)}%
                        </span>
                        <Info className="w-4 h-4 text-[#b1bad3]" />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-6 bg-[#1a2c38] rounded-full overflow-hidden mb-3">
                    <div
                        className="absolute top-0 left-0 h-full bg-[#cfa563] rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Tiers Row */}
                <div className="flex justify-between items-center text-sm font-medium">
                    <div className="flex items-center gap-1.5 text-[#b1bad3]">
                        <Star className="w-3.5 h-3.5" />
                        <span>{currentTier.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#b1bad3]">
                        <Star className="w-3.5 h-3.5" />
                        <span>{nextTier ? nextTier.name : 'Max'}</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
