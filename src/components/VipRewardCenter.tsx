import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVipRewards, type VipReward } from '@/hooks/useVipRewards';
import { useWallet } from '@/context/WalletContext';
import { Calendar, TrendingUp, TrendingDown, Gift, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface VipRewardCenterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VipRewardCenter({ open, onOpenChange }: VipRewardCenterProps) {
    const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
    const { pendingRewards, claimedRewards, loading, fetchRewards, claimReward } = useVipRewards();
    const { refreshBalance } = useWallet();
    const [claiming, setClaiming] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchRewards();
        }
    }, [open, fetchRewards]);

    const handleClaim = async (rewardId: string) => {
        setClaiming(rewardId);
        try {
            const success = await claimReward(rewardId);
            if (success) {
                await refreshBalance();
            }
        } finally {
            setClaiming(null);
        }
    };

    const filterRewards = (rewards: VipReward[], period: 'weekly' | 'monthly') =>
        rewards.filter(r => r.period === period);

    const RewardCard = ({ reward, isPending }: { reward: VipReward; isPending: boolean }) => (
        <div className="bg-[#0f212e] rounded-lg border border-[#2f4553] p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#1a2c38] flex items-center justify-center">
                        {reward.reward_type === 'wagerback' ? (
                            <TrendingUp className="w-6 h-6 text-[#1475e1]" />
                        ) : (
                            <TrendingDown className="w-6 h-6 text-[#F7D979]" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-white capitalize">
                            {reward.reward_type === 'wagerback' ? 'Wager Reward' : 'Loss Cashback'}
                        </h4>
                        <p className="text-xs text-[#b1bad3]">
                            {format(new Date(reward.start_date), 'MMM d')} - {format(new Date(reward.end_date), 'MMM d, yyyy')}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className="border-[#2f4553] text-white"
                    style={{ backgroundColor: getTierColor(reward.tier_name) }}
                >
                    {reward.tier_name}
                </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#1a2c38] rounded p-2">
                    <p className="text-xs text-[#b1bad3]">Total Wagered</p>
                    <p className="font-bold text-white">${reward.total_wagered.toFixed(2)}</p>
                </div>
                {reward.reward_type === 'cashback' && (
                    <div className="bg-[#1a2c38] rounded p-2">
                        <p className="text-xs text-[#b1bad3]">Net Loss</p>
                        <p className="font-bold text-white">${reward.total_lost.toFixed(2)}</p>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#2f4553]">
                <div>
                    <p className="text-xs text-[#b1bad3]">Reward Amount</p>
                    <p className="text-2xl font-bold text-[#1475e1]">${reward.reward_amount.toFixed(2)}</p>
                </div>
                {isPending ? (
                    <Button
                        onClick={() => handleClaim(reward.id)}
                        disabled={claiming === reward.id}
                        className="bg-[#1475e1] hover:bg-[#1266c9] text-white font-bold"
                    >
                        {claiming === reward.id ? 'Claiming...' : 'Claim'}
                    </Button>
                ) : (
                    <div className="flex items-center gap-2 text-[#b1bad3]">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">
                            Claimed {format(new Date(reward.claimed_at!), 'MMM d, yyyy')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    const pendingWeekly = filterRewards(pendingRewards, 'weekly');
    const pendingMonthly = filterRewards(pendingRewards, 'monthly');
    const claimedWeekly = filterRewards(claimedRewards, 'weekly');
    const claimedMonthly = filterRewards(claimedRewards, 'monthly');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-[#1a2c38] border-[#2f4553] text-white max-h-[90vh] overflow-hidden">
                <DialogHeader className="border-b border-[#2f4553] pb-4">
                    <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-[#F7D979]" />
                        <DialogTitle className="text-xl font-bold">VIP Reward Center</DialogTitle>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'weekly' | 'monthly')} className="w-full">
                    <TabsList className="w-full bg-[#0f212e] p-1 grid grid-cols-2">
                        <TabsTrigger
                            value="weekly"
                            className="data-[state=active]:bg-[#2f4553] data-[state=active]:text-white text-[#b1bad3]"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Weekly Rewards
                        </TabsTrigger>
                        <TabsTrigger
                            value="monthly"
                            className="data-[state=active]:bg-[#2f4553] data-[state=active]:text-white text-[#b1bad3]"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Monthly Rewards
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-4 max-h-[60vh] overflow-y-auto">
                        <TabsContent value="weekly" className="space-y-4 mt-0">
                            {loading ? (
                                <div className="text-center py-8 text-[#b1bad3]">Loading rewards...</div>
                            ) : (
                                <>
                                    {pendingWeekly.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-[#b1bad3] mb-3">Pending Rewards</h3>
                                            <div className="space-y-3">
                                                {pendingWeekly.map(reward => (
                                                    <RewardCard key={reward.id} reward={reward} isPending={true} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {claimedWeekly.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-bold text-[#b1bad3] mb-3">Recent Claims</h3>
                                            <div className="space-y-3">
                                                {claimedWeekly.map(reward => (
                                                    <RewardCard key={reward.id} reward={reward} isPending={false} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {pendingWeekly.length === 0 && claimedWeekly.length === 0 && (
                                        <div className="text-center py-12">
                                            <Gift className="w-16 h-16 text-[#2f4553] mx-auto mb-4" />
                                            <p className="text-[#b1bad3]">No weekly rewards yet</p>
                                            <p className="text-sm text-[#b1bad3] mt-2">
                                                Keep playing to earn weekly wager rewards and cashback!
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="monthly" className="space-y-4 mt-0">
                            {loading ? (
                                <div className="text-center py-8 text-[#b1bad3]">Loading rewards...</div>
                            ) : (
                                <>
                                    {pendingMonthly.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold text-[#b1bad3] mb-3">Pending Rewards</h3>
                                            <div className="space-y-3">
                                                {pendingMonthly.map(reward => (
                                                    <RewardCard key={reward.id} reward={reward} isPending={true} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {claimedMonthly.length > 0 && (
                                        <div className="mt-6">
                                            <h3 className="text-sm font-bold text-[#b1bad3] mb-3">Recent Claims</h3>
                                            <div className="space-y-3">
                                                {claimedMonthly.map(reward => (
                                                    <RewardCard key={reward.id} reward={reward} isPending={false} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {pendingMonthly.length === 0 && claimedMonthly.length === 0 && (
                                        <div className="text-center py-12">
                                            <Gift className="w-16 h-16 text-[#2f4553] mx-auto mb-4" />
                                            <p className="text-[#b1bad3]">No monthly rewards yet</p>
                                            <p className="text-sm text-[#b1bad3] mt-2">
                                                Keep playing to earn monthly wager rewards and cashback!
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

function getTierColor(tierName: string): string {
    const colors: Record<string, string> = {
        Bronze: '#CD7F32',
        Silver: '#C0C0C0',
        Gold: '#FFD700',
        Platinum: '#00CED1',
        Diamond: '#B9F2FF',
    };
    return colors[tierName] || '#CD7F32';
}
