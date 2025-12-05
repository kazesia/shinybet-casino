import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Users as UsersIcon, DollarSign, TrendingUp, Zap, Percent, Coins, Globe, Headphones, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateOverviewProps {
    affiliate: any;
}

export function AffiliateOverview({ affiliate }: AffiliateOverviewProps) {
    const { stats, loading, getReferralLink } = affiliate;

    const handleCopy = () => {
        const link = getReferralLink();
        navigator.clipboard.writeText(link);
        toast.success('Referral link copied!');
    };

    return (
        <div className="space-y-6">
            {/* Header Description */}
            <div className="bg-[#1a2c38] rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-2">Overview</h2>
                <p className="text-[#b1bad3]">
                    Earn commission for all bets placed by your referrals across Casino and Sportsbook.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[#b1bad3] text-sm font-medium">Worldwide Customers</span>
                        <UsersIcon className="w-5 h-5 text-[#F7D979]" />
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {loading ? '...' : (stats?.totalReferrals || 0)}
                    </div>
                </Card>

                <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[#b1bad3] text-sm font-medium">Payment Methods</span>
                        <DollarSign className="w-5 h-5 text-[#00e701]" />
                    </div>
                    <div className="text-3xl font-bold text-white">44</div>
                </Card>

                <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[#b1bad3] text-sm font-medium">Languages Supported</span>
                        <Globe className="w-5 h-5 text-[#1475e1]" />
                    </div>
                    <div className="text-3xl font-bold text-white">16</div>
                </Card>
            </div>

            {/* Referral Link */}
            <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                <div className="mb-4">
                    <h3 className="text-white font-semibold mb-1">Affiliate Link</h3>
                </div>
                <div className="flex gap-2">
                    <Input
                        value={getReferralLink()}
                        readOnly
                        className="bg-[#0f212e] border-[#2f4553] text-white font-mono"
                    />
                    <Button
                        onClick={handleCopy}
                        className="bg-[#2f4553] hover:bg-[#3d5565] text-white shrink-0"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                    </Button>
                </div>
            </Card>

            {/* Exclusive Advantages */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Exclusive Advantages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#00e701]/10 rounded-lg">
                                <Zap className="w-6 h-6 text-[#00e701]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Instant Payout</h4>
                                <p className="text-[#b1bad3] text-sm">
                                    Skip the wait. See earnings instantly in your account.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#F7D979]/10 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-[#F7D979]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Lifetime Commission</h4>
                                <p className="text-[#b1bad3] text-sm">
                                    If the people you refer keep playing, you keep getting paid.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#1475e1]/10 rounded-lg">
                                <Percent className="w-6 h-6 text-[#1475e1]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Market Leading Player Value</h4>
                                <p className="text-[#b1bad3] text-sm">
                                    Grow your earnings with some of the highest returns offered to players.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#00e701]/10 rounded-lg">
                                <Lock className="w-6 h-6 text-[#00e701]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Customise Your Commission</h4>
                                <p className="text-[#b1bad3] text-sm">
                                    Tailor your commission plan to fit your unique business needs.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#F7D979]/10 rounded-lg">
                                <Coins className="w-6 h-6 text-[#F7D979]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">Crypto & Local Currencies</h4>
                                <p className="text-[#b1bad3] text-sm">
                                    Earn your way with support for both cryptocurrency and local currencies.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#1a2c38] border-[#2f4553] p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#1475e1]/10 rounded-lg">
                                <Headphones className="w-6 h-6 text-[#1475e1]" />
                            </div>
                            <div>
                                <h4 className="text-white font-semibold mb-2">24x7 Multi Language Support</h4>
                                <p className="text-[#b1bad3] text-sm">
                                    Get the help you want in your preferred language all day, everyday.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            {/* Active Campaigns */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Active Campaigns</h3>
                {affiliate.campaigns && affiliate.campaigns.length > 0 ? (
                    <div className="grid gap-4">
                        {affiliate.campaigns.map((campaign: any) => (
                            <Card key={campaign.id} className="bg-[#1a2c38] border-[#2f4553] p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="text-white font-semibold">{campaign.name}</h4>
                                    <p className="text-[#b1bad3] text-sm">Code: <span className="text-[#F7D979] font-mono">{campaign.referral_code}</span></p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <div className="text-sm text-[#b1bad3]">Commission</div>
                                        <div className="text-white font-bold">{(campaign.commission_rate * 100).toFixed(1)}%</div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            const link = `${window.location.origin}/?c=${campaign.referral_code}`;
                                            navigator.clipboard.writeText(link);
                                            toast.success('Campaign link copied!');
                                        }}
                                        className="bg-[#2f4553] hover:bg-[#3d5565] text-white"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy Link
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-[#1a2c38] border-[#2f4553] p-8 text-center">
                        <p className="text-[#b1bad3]">No active campaigns. Create one to start tracking specific sources!</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
