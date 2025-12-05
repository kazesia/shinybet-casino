import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
    Users,
    DollarSign,
    TrendingUp,
    Search,
    Download,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal
} from 'lucide-react';

export default function AdminAffiliates() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAffiliates: 0,
        totalReferrals: 0,
        totalCommissionPaid: 0,
        pendingCommission: 0
    });
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAffiliateData();
    }, []);

    const fetchAffiliateData = async () => {
        try {
            setLoading(true);

            // Fetch stats
            const { count: affiliateCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .not('referral_id', 'is', null);

            const { count: referralCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .not('referred_by_user_id', 'is', null);

            // Fetch commission stats
            const { data: earnings } = await supabase
                .from('affiliate_earnings')
                .select('amount, currency');

            const totalCommission = earnings?.reduce((acc, curr) => {
                // Simplified USD aggregation for demo
                return acc + Number(curr.amount);
            }, 0) || 0;

            setStats({
                totalAffiliates: affiliateCount || 0,
                totalReferrals: referralCount || 0,
                totalCommissionPaid: totalCommission, // This would ideally be split by paid/pending
                pendingCommission: 0
            });

            // Fetch campaigns
            const { data: campaignsData } = await supabase
                .from('affiliate_campaigns')
                .select(`
          *,
          profiles:user_id (username)
        `)
                .order('created_at', { ascending: false })
                .limit(50);

            setCampaigns(campaignsData || []);

        } catch (error) {
            console.error('Error fetching affiliate data:', error);
            toast.error('Failed to load affiliate data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Affiliate Management</h1>
                    <p className="text-zinc-400">Monitor and manage affiliate program performance</p>
                </div>
                <Button className="bg-[#1475e1] hover:bg-[#1266c9]">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[#b1bad3] text-sm">Total Affiliates</span>
                        <Users className="w-4 h-4 text-[#1475e1]" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalAffiliates}</div>
                </Card>

                <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[#b1bad3] text-sm">Total Referrals</span>
                        <TrendingUp className="w-4 h-4 text-[#00e701]" />
                    </div>
                    <div className="text-2xl font-bold text-white">{stats.totalReferrals}</div>
                </Card>

                <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[#b1bad3] text-sm">Commission Paid</span>
                        <DollarSign className="w-4 h-4 text-[#F7D979]" />
                    </div>
                    <div className="text-2xl font-bold text-white">${stats.totalCommissionPaid.toFixed(2)}</div>
                </Card>

                <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[#b1bad3] text-sm">Pending Commission</span>
                        <DollarSign className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-white">${stats.pendingCommission.toFixed(2)}</div>
                </Card>
            </div>

            {/* Campaigns Table */}
            <Card className="bg-[#1a2c38] border-[#2f4553]">
                <div className="p-4 border-b border-[#2f4553] flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#b1bad3]" />
                            <Input
                                placeholder="Search campaigns..."
                                className="pl-9 bg-[#0f212e] border-[#2f4553] w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="border-[#2f4553] bg-[#0f212e] text-[#b1bad3]">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0f212e] text-[#b1bad3] text-sm">
                            <tr>
                                <th className="px-6 py-3 text-left">Campaign Name</th>
                                <th className="px-6 py-3 text-left">Affiliate</th>
                                <th className="px-6 py-3 text-left">Referral Code</th>
                                <th className="px-6 py-3 text-left">Commission Rate</th>
                                <th className="px-6 py-3 text-left">Created At</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-[#b1bad3]">
                                        Loading...
                                    </td>
                                </tr>
                            ) : campaigns.length > 0 ? (
                                campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="border-b border-[#2f4553] hover:bg-[#213743]">
                                        <td className="px-6 py-4 text-white font-medium">{campaign.name}</td>
                                        <td className="px-6 py-4 text-[#b1bad3]">{campaign.profiles?.username || 'Unknown'}</td>
                                        <td className="px-6 py-4 text-[#F7D979] font-mono">{campaign.referral_code}</td>
                                        <td className="px-6 py-4 text-white">{(campaign.commission_rate * 100).toFixed(1)}%</td>
                                        <td className="px-6 py-4 text-[#b1bad3]">
                                            {new Date(campaign.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-[#b1bad3]">
                                        No campaigns found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-[#2f4553] flex items-center justify-between">
                    <span className="text-sm text-[#b1bad3]">Showing {campaigns.length} results</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled className="border-[#2f4553] bg-[#0f212e] text-[#b1bad3]">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled className="border-[#2f4553] bg-[#0f212e] text-[#b1bad3]">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
