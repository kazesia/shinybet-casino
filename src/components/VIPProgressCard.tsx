import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';

// VIP Tiers configuration
const VIP_TIERS = [
    { name: 'Bronze', minWager: 0, color: '#CD7F32' },
    { name: 'Silver', minWager: 10000, color: '#C0C0C0' },
    { name: 'Gold', minWager: 50000, color: '#FFD700' },
    { name: 'Platinum', minWager: 100000, color: '#E5E4E2' },
    { name: 'Diamond', minWager: 500000, color: '#B9F2FF' },
];

export function VIPProgressCard() {
    const { profile } = useAuth();
    const { stats } = useDashboardData();

    const wagered = stats?.total_wagered || 0;

    // Calculate current tier
    const currentTierIndex = VIP_TIERS.slice().reverse().findIndex(t => wagered >= t.minWager);
    const actualIndex = currentTierIndex === -1 ? 0 : VIP_TIERS.length - 1 - currentTierIndex;
    const currentTier = VIP_TIERS[actualIndex];
    const nextTier = VIP_TIERS[actualIndex + 1];

    // Calculate progress percentage
    let progressPercent = 0;
    if (nextTier) {
        const totalNeeded = nextTier.minWager - currentTier.minWager;
        const currentProgress = wagered - currentTier.minWager;
        progressPercent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
    } else {
        progressPercent = 100;
    }

    return (
        <div className="bg-[#1a2c38] border border-[#2f4553] rounded-lg p-4 mb-4">
            {/* Header with username and star */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-base">{profile?.username || 'Player'}</h3>
                <button className="text-[#b1bad3] hover:text-[#FFD700] transition-colors">
                    <Star className="w-5 h-5" />
                </button>
            </div>

            {/* VIP Progress */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[#b1bad3]">Your VIP Progress</span>
                    <span className="text-white font-bold">{progressPercent.toFixed(2)}%</span>
                </div>
                <div className="h-2 bg-[#0f212e] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-[#F7D979] to-[#FFD700] transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Tier Badges */}
            <div className="flex items-center justify-between">
                {/* Current Tier */}
                <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4" style={{ color: currentTier.color }} fill={currentTier.color} />
                    <span className="text-xs font-medium" style={{ color: currentTier.color }}>
                        {currentTier.name}
                    </span>
                </div>

                {/* Next Tier */}
                {nextTier && (
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4" style={{ color: nextTier.color }} fill={nextTier.color} />
                        <span className="text-xs font-medium" style={{ color: nextTier.color }}>
                            {nextTier.name}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
