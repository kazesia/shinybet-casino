import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Crown, Star, Gem, Diamond, Info, ChevronDown, Lock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StarButton } from '@/components/ui/star-button';
import { useAuth } from '@/context/AuthContext';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useWallet } from '@/context/WalletContext';
import { useRakeback } from '@/hooks/useRakeback';
import { useBonusClaims } from '@/hooks/useBonusClaims';
import { toast } from 'sonner';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const VIP_TIERS = [
    {
        name: 'Bronze',
        icon: Star,
        color: '#CD7F32',
        wagerRequired: 10000,
        benefits: [
            'Bonus from Support in currency of your choice',
            'Rakeback enabled',
            'Weekly bonuses',
            'Monthly bonuses',
            'VIP Telegram channel access'
        ]
    },
    {
        name: 'Silver',
        icon: Star,
        color: '#C0C0C0',
        wagerRequired: 50000,
        benefits: [
            'Bonus from Support in currency of your choice',
            'Monthly bonus increased'
        ]
    },
    {
        name: 'Gold',
        icon: Crown,
        color: '#FFD700',
        wagerRequired: 250000,
        benefits: [
            'Bonus from Support in currency of your choice',
            'Monthly bonus increased'
        ]
    },
    {
        name: 'Platinum I - III',
        icon: Gem,
        color: '#00CED1',
        wagerRequired: 1000000,
        benefits: [
            'Bonus from Support in currency of your choice',
            'Monthly bonus increased',
            '14 - 42 day, daily bonus (Reload)'
        ]
    },
    {
        name: 'Platinum IV - VI',
        icon: Gem,
        color: '#00CED1',
        wagerRequired: 5000000,
        benefits: [
            'Dedicated VIP host',
            'Unlimited Reloads while maintaining a VIP host',
            'Bonus from VIP host in currency of your choice',
            'Weekly & monthly bonuses increased'
        ]
    },
    {
        name: 'Diamond I - V',
        icon: Diamond,
        color: '#B9F2FF',
        wagerRequired: 25000000,
        benefits: [
            'Bonus from VIP host in currency of your choice',
            'Exclusively customized benefits',
            'Weekly & monthly bonuses increased'
        ]
    }
];

interface VIPModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ClaimStep = 'list' | 'confirm' | 'success';

export function VIPModal({ open, onOpenChange }: VIPModalProps) {
    const { profile } = useAuth();
    const { stats } = useDashboardData();
    const { refreshBalance } = useWallet();
    const { rakebackData, loading: rakebackLoading, calculateRakeback, claimRakeback, error: rakebackError } = useRakeback();
    const { claimWeeklyBoost, claimMonthlyBonus, claimPlatinumReload } = useBonusClaims();
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedReward, setExpandedReward] = useState<string | null>(null);
    const [claimStep, setClaimStep] = useState<ClaimStep>('list');
    const [claiming, setClaiming] = useState(false);

    // Calculate VIP Progress based on real wagering data
    const wagered = stats?.total_wagered || 0;

    // Find current tier
    const currentTierIndex = VIP_TIERS.slice().reverse().findIndex(t => wagered >= t.wagerRequired);
    const actualIndex = currentTierIndex === -1 ? -1 : VIP_TIERS.length - 1 - currentTierIndex;

    const currentTier = actualIndex >= 0 ? VIP_TIERS[actualIndex] : null;
    const nextTier = actualIndex < VIP_TIERS.length - 1 ? VIP_TIERS[actualIndex + 1] : null;

    // Calculate progress percentage
    let vipProgressPercent = 0;
    if (!currentTier && nextTier) {
        vipProgressPercent = Math.min(100, (wagered / nextTier.wagerRequired) * 100);
    } else if (currentTier && nextTier) {
        const totalNeeded = nextTier.wagerRequired - currentTier.wagerRequired;
        const currentProgress = wagered - currentTier.wagerRequired;
        vipProgressPercent = Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
    } else if (currentTier && !nextTier) {
        vipProgressPercent = 100;
    }

    const CurrentTierIcon = currentTier?.icon || Star;
    const NextTierIcon = nextTier?.icon || Star;

    // Get rakeback amount from real calculation
    const rakebackAmount = rakebackData?.amount_usd || 0;

    // Calculate rakeback when modal opens and switches to rewards tab
    useEffect(() => {
        if (open && activeTab === 'rewards') {
            calculateRakeback();
        }
    }, [open, activeTab, calculateRakeback]);

    const handleInitialClaimClick = async () => {
        // Ensure we have fresh rakeback data
        await calculateRakeback();

        if (rakebackError) {
            toast.error('Cannot claim rakeback', {
                description: rakebackError,
            });
            return;
        }

        if (rakebackAmount > 0) {
            setClaimStep('confirm');
        } else {
            toast.info('No rakeback available', {
                description: 'Place more bets to earn rakeback rewards.',
            });
        }
    };

    const handleConfirmClaim = async () => {
        if (claiming || rakebackAmount === 0) return;

        setClaiming(true);
        try {
            const success = await claimRakeback();

            if (success) {
                // Refresh wallet balance
                await refreshBalance();
                // Recalculate rakeback (should be 0 now)
                await calculateRakeback();
                setClaimStep('success');
            }
        } catch (error) {
            console.error('Claim error:', error);
        } finally {
            setClaiming(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after a short delay to allow animation to finish
        setTimeout(() => {
            setClaimStep('list');
        }, 300);
    };

    const handleReturnToRewards = async () => {
        setClaimStep('list');
        // Recalculate rakeback when returning to rewards list
        await calculateRakeback();
    };

    // Render content based on claim step
    const renderContent = () => {
        if (claimStep === 'confirm') {
            return (
                <div className="flex flex-col h-full bg-[#1a2c38] text-white">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#2f4553] flex items-center justify-between bg-[#0f212e]">
                        <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-white" />
                            <h2 className="text-lg font-bold">Claim Rakeback</h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8 text-[#b1bad3] hover:text-white hover:bg-[#2f4553] rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col items-center">
                        {/* Gift Image Placeholder */}
                        <div className="w-full h-48 bg-[#0f212e] rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
                            {/* Abstract background shapes */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1475e1] rounded-full blur-3xl"></div>
                                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#F7D979] rounded-full blur-3xl"></div>
                            </div>
                            <Gift className="w-24 h-24 text-[#F7D979] relative z-10" />
                        </div>

                        <div className="w-full text-left mb-6">
                            <h3 className="text-xl font-bold text-white mb-1">Claim Your Rakeback</h3>
                            <p className="text-[#b1bad3] text-sm">You have Rakeback available! Claim it now.</p>
                            {rakebackData && (
                                <p className="text-xs text-[#b1bad3] mt-2">
                                    Based on {rakebackData.bet_count} bets • {(rakebackData.rakeback_rate * 100).toFixed(0)}% rakeback rate
                                </p>
                            )}
                        </div>

                        {/* Crypto Breakdown */}
                        <div className="w-full bg-[#0f212e] rounded-lg border border-[#2f4553] p-4 space-y-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#F7931A] flex items-center justify-center text-white font-bold text-xs">₿</div>
                                    <div>
                                        <div className="font-bold text-white text-sm">BTC</div>
                                        <div className="text-xs text-[#b1bad3]">Bitcoin</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">0.00000000</div>
                                    <div className="text-xs text-[#b1bad3]">$0.00 USD</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#00e701] flex items-center justify-center text-white font-bold text-xs">$</div>
                                    <div>
                                        <div className="font-bold text-white text-sm">USD</div>
                                        <div className="text-xs text-[#b1bad3]">US Dollar</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">{rakebackAmount.toFixed(2)}</div>
                                    <div className="text-xs text-[#b1bad3]">${rakebackAmount.toFixed(2)} USD</div>
                                </div>
                            </div>

                            <div className="h-px bg-[#2f4553] w-full my-2"></div>

                            <div className="flex items-center justify-between">
                                <div className="font-bold text-white text-sm">Total Rakeback:</div>
                                <div className="font-bold text-white text-sm">${rakebackAmount.toFixed(2)} USD</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                            <Button
                                variant="outline"
                                onClick={handleReturnToRewards}
                                className="bg-[#2f4553] border-none text-white hover:bg-[#3d5565] h-12 font-bold"
                            >
                                Return to Rewards
                            </Button>
                            <Button
                                onClick={handleConfirmClaim}
                                disabled={claiming}
                                className="bg-[#1475e1] hover:bg-[#1266c9] text-white h-12 font-bold"
                            >
                                {claiming ? 'Claiming...' : 'Claim Rakeback'}
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        if (claimStep === 'success') {
            return (
                <div className="flex flex-col h-full bg-[#1a2c38] text-white">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#2f4553] flex items-center justify-between bg-[#0f212e]">
                        <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5 text-white" />
                            <h2 className="text-lg font-bold">Claim Rakeback</h2>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8 text-[#b1bad3] hover:text-white hover:bg-[#2f4553] rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col items-center">
                        {/* Gift Image Placeholder */}
                        <div className="w-full h-48 bg-[#0f212e] rounded-lg mb-6 flex items-center justify-center relative overflow-hidden">
                            {/* Abstract background shapes */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-20">
                                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1475e1] rounded-full blur-3xl"></div>
                                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#F7D979] rounded-full blur-3xl"></div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <Gift className="w-24 h-24 text-[#1475e1] mb-2" />
                                <div className="flex gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#F7D979] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-4 h-4 rounded-full bg-[#1475e1] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-4 h-4 rounded-full bg-[#F7931A] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="w-full text-left mb-6">
                            <h3 className="text-xl font-bold text-white mb-1">Rakeback Claimed!</h3>
                            <p className="text-[#b1bad3] text-sm">You have received the following Rakeback.</p>
                        </div>

                        {/* Claimed Amount */}
                        <div className="w-full bg-[#0f212e] rounded-lg border border-[#2f4553] p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#00e701] flex items-center justify-center text-white font-bold text-xs">$</div>
                                    <div>
                                        <div className="font-bold text-white text-sm">USD</div>
                                        <div className="text-xs text-[#b1bad3]">US Dollar</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-white text-sm">{rakebackAmount.toFixed(2)}</div>
                                    <div className="text-xs text-[#b1bad3]">${rakebackAmount.toFixed(2)} USD</div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="w-full grid grid-cols-2 gap-3 mt-auto">
                            <Button
                                variant="outline"
                                onClick={handleReturnToRewards}
                                className="bg-[#2f4553] border-none text-white hover:bg-[#3d5565] h-12 font-bold"
                            >
                                Return to Rewards
                            </Button>
                            <Button
                                onClick={handleClose}
                                className="bg-[#1475e1] hover:bg-[#1266c9] text-white h-12 font-bold"
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        // Default List View
        return (
            <>
                {/* Header with Close Button */}
                <div className="px-6 py-4 border-b border-[#2f4553] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/icons/vip.png" alt="VIP" className="w-8 h-8" />
                        <h2 className="text-xl font-black text-white italic tracking-wide">VIP CLUB</h2>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div className="px-6 pt-4">
                        <TabsList className="w-full bg-[#0f212e] p-1 grid grid-cols-2">
                            <TabsTrigger
                                value="overview"
                                className="data-[state=active]:bg-[#2f4553] data-[state=active]:text-white text-[#b1bad3] rounded-lg"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="rewards"
                                className="data-[state=active]:bg-[#2f4553] data-[state=active]:text-white text-[#b1bad3] rounded-lg"
                            >
                                Rewards
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="px-6 pb-6 overflow-y-auto flex-1">
                        {/* Overview Tab */}
                        <TabsContent value="overview" className="mt-4 space-y-4">
                            {/* User VIP Progress Card */}
                            <div className="bg-[#0f212e] border-2 border-[#F7D979] rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-white font-bold text-lg">{profile?.username || 'Guest'}</span>
                                    <Crown className="w-6 h-6 text-[#F7D979]" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#b1bad3] text-sm font-medium">Your VIP Progress</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-white font-bold text-lg">{vipProgressPercent.toFixed(2)}%</span>
                                            <Info className="w-4 h-4 text-[#b1bad3]" />
                                        </div>
                                    </div>

                                    <div className="h-3 bg-[#1a2c38] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#CD7F32] via-[#F7D979] to-[#FFD700] transition-all duration-500"
                                            style={{ width: `${vipProgressPercent}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <CurrentTierIcon
                                                className="w-4 h-4"
                                                style={{ color: currentTier?.color || '#CD7F32' }}
                                            />
                                            <span className="text-[#b1bad3] font-medium">
                                                {currentTier?.name || 'No Tier'}
                                            </span>
                                        </div>
                                        {nextTier && (
                                            <div className="flex items-center gap-1.5">
                                                <NextTierIcon
                                                    className="w-4 h-4"
                                                    style={{ color: nextTier.color }}
                                                />
                                                <span className="text-[#b1bad3] font-medium">{nextTier.name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-[#2f4553]">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-[#b1bad3]">Total Wagered</span>
                                            <span className="text-white font-bold">${wagered.toLocaleString()}</span>
                                        </div>
                                        {nextTier && (
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-[#b1bad3]">Next Tier Requirement</span>
                                                <span className="text-white font-bold">${nextTier.wagerRequired.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* VIP Benefits Accordion */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="benefits" className="border-[#2f4553] bg-[#0f212e] rounded-lg px-4">
                                    <AccordionTrigger className="text-white hover:text-white hover:no-underline py-4">
                                        VIP Benefits
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-4 pt-2 pb-4">
                                            {VIP_TIERS.map((tier, index) => {
                                                const Icon = tier.icon;
                                                return (
                                                    <div key={index} className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4" style={{ color: tier.color }} />
                                                            <span className="font-bold text-white">{tier.name}</span>
                                                            <span className="text-xs text-[#b1bad3]">
                                                                (${(tier.wagerRequired / 1000).toFixed(0)}k wager)
                                                            </span>
                                                        </div>
                                                        <ul className="space-y-1 pl-6">
                                                            {tier.benefits.map((benefit, i) => (
                                                                <li key={i} className="text-sm text-[#b1bad3] list-disc">
                                                                    {benefit}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            {/* VIP Host Accordion */}
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="host" className="border-[#2f4553] bg-[#0f212e] rounded-lg px-4">
                                    <AccordionTrigger className="text-white hover:text-white hover:no-underline py-4">
                                        VIP Host
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-3 pt-2 pb-4">
                                            <p className="text-sm text-[#b1bad3]">
                                                Reach Platinum IV to receive your own dedicated VIP host who will cater to your betting needs.
                                            </p>
                                            <div className="bg-[#1a2c38] rounded-lg p-4 space-y-2">
                                                <h4 className="font-bold text-white text-sm">VIP Host Benefits</h4>
                                                <ul className="space-y-1 text-sm text-[#b1bad3]">
                                                    <li>• VIP hosts cater to your needs and ensure your time at Shiny is unmatched</li>
                                                    <li>• Your personal point of contact at Shiny</li>
                                                    <li>• Tailored bonuses and perks to your betting habits</li>
                                                    <li>• Longer VIP generating window</li>
                                                    <li>• Exclusive promotions and events</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>

                            <div className="text-center pt-2">
                                <a
                                    href="/vip-club"
                                    className="text-sm text-[#1475e1] hover:underline"
                                    onClick={handleClose}
                                >
                                    Learn more about being a Shiny VIP
                                </a>
                            </div>
                        </TabsContent>

                        {/* Rewards Tab - Enhanced */}
                        <TabsContent value="rewards" className="mt-4 space-y-3">
                            {/* Rakeback - Claimable */}
                            <div className="bg-[#0f212e] rounded-lg border border-[#2f4553] overflow-hidden group hover:border-[#F7D979]/50 transition-colors duration-300">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {/* Enhanced Icon */}
                                        <div className="relative w-12 h-12 flex items-center justify-center bg-[#2f4553]/50 rounded-xl group-hover:bg-[#2f4553] transition-colors">
                                            <img src="/icons/rakeback_icon.png" alt="Rakeback" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-[#F7D979] transition-colors">Rakeback</h4>
                                            <p className="text-xs text-[#b1bad3]">
                                                {rakebackLoading ? 'Calculating...' : rakebackAmount > 0 ? `$${rakebackAmount.toFixed(2)} available!` : 'Unlock every 12 hours based on wager'}
                                            </p>
                                        </div>
                                    </div>
                                    <StarButton
                                        onClick={handleInitialClaimClick}
                                        disabled={rakebackLoading || rakebackAmount === 0}
                                        className="h-9 min-w-[80px]"
                                        variant="gold"
                                    >
                                        {rakebackAmount > 0 ? 'Claim' : 'Locked'}
                                    </StarButton>
                                </div>
                            </div>


                            {/* Weekly Boost - Claimable */}
                            <div className="bg-[#0f212e] rounded-lg border border-[#2f4553] overflow-hidden group hover:border-[#F7D979]/50 transition-colors duration-300">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 flex items-center justify-center bg-[#2f4553]/50 rounded-xl group-hover:bg-[#2f4553] transition-colors">
                                            <img src="/icons/weekly_boost_icon.png" alt="Weekly Boost" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-[#F7D979] transition-colors">Weekly Boost</h4>
                                            <p className="text-xs text-[#b1bad3]">$5.00 available!</p>
                                        </div>
                                    </div>
                                    <StarButton
                                        onClick={async () => {
                                            const success = await claimWeeklyBoost();
                                            if (success) await refreshBalance();
                                        }}
                                        className="h-9 min-w-[80px]"
                                        variant="gold"
                                    >
                                        Claim
                                    </StarButton>
                                </div>
                            </div>

                            {/* Monthly Bonus - Claimable */}
                            <div className="bg-[#0f212e] rounded-lg border border-[#2f4553] overflow-hidden group hover:border-[#F7D979]/50 transition-colors duration-300">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 flex items-center justify-center bg-[#2f4553]/50 rounded-xl group-hover:bg-[#2f4553] transition-colors">
                                            <img src="/icons/monthly_boost_icon.png" alt="Monthly Bonus" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-[#F7D979] transition-colors">Monthly Bonus</h4>
                                            <p className="text-xs text-[#b1bad3]">$25.00 available!</p>
                                        </div>
                                    </div>
                                    <StarButton
                                        onClick={async () => {
                                            const success = await claimMonthlyBonus();
                                            if (success) await refreshBalance();
                                        }}
                                        className="h-9 min-w-[80px]"
                                        variant="gold"
                                    >
                                        Claim
                                    </StarButton>
                                </div>
                            </div>

                            {/* Platinum Reload - Claimable for Platinum+ */}
                            <div className={`bg-[#0f212e] rounded-lg border border-[#2f4553] overflow-hidden group hover:border-[#F7D979]/50 transition-colors duration-300 ${wagered < 1000000 ? 'opacity-60 grayscale' : ''}`}>
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-12 h-12 flex items-center justify-center bg-[#2f4553]/50 rounded-xl group-hover:bg-[#2f4553] transition-colors">
                                            <img src="/icons/platinum_reload_icon.png" alt="Platinum Reload" className="w-8 h-8 object-contain" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-[#F7D979] transition-colors">Platinum Reload</h4>
                                            <p className="text-xs text-[#b1bad3]">{wagered >= 1000000 ? '$10.00 available!' : 'Unlocked at Platinum VIP'}</p>
                                        </div>
                                    </div>
                                    {wagered >= 1000000 ? (
                                        <StarButton
                                            onClick={async () => {
                                                const success = await claimPlatinumReload();
                                                if (success) await refreshBalance();
                                            }}
                                            className="h-9 min-w-[80px]"
                                            variant="gold"
                                        >
                                            Claim
                                        </StarButton>
                                    ) : (
                                        <Lock className="w-5 h-5 text-[#b1bad3]" />
                                    )}
                                </div>
                            </div>

                            {/* Join Telegram */}
                            <div className="text-center pt-4">
                                <a href="#" className="text-sm text-[#1475e1] hover:underline font-medium">
                                    Join the Stake VIP Telegram Channel
                                </a>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-[#1a2c38] border-[#2f4553] text-white p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
}
