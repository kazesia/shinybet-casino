import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Filter, Download, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { CreateCampaignModal } from './CreateCampaignModal';

interface AffiliateCampaignsProps {
    affiliate: any;
}

export function AffiliateCampaigns({ affiliate }: AffiliateCampaignsProps) {
    const { campaigns, loading, createCampaign } = affiliate;
    const [sortBy, setSortBy] = useState('date-new');
    const [showCreateModal, setShowCreateModal] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Campaigns</h2>
                <p className="text-[#b1bad3]">
                    See the performance of all your campaigns in one simple view below.
                </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">Campaign Hits</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {campaigns?.reduce((acc: number, c: any) => acc + (c.hits || 0), 0) || 0}
                    </div>
                </div>

                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">Referred Users</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {campaigns?.reduce((acc: number, c: any) => acc + (c.referred_users || 0), 0) || 0}
                    </div>
                </div>

                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">First Time Deposits (FTD)</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">0</div>
                </div>

                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">Total Deposits</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">0</div>
                </div>

                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">Overall Commission</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">$0.00 USD</div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#b1bad3]" />
                    <span className="text-white text-sm font-medium">Sort</span>
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-[#1a2c38] border border-[#2f4553] rounded-lg px-4 py-2 text-white text-sm"
                >
                    <option value="date-new">Date Created: New to Old</option>
                    <option value="date-old">Date Created: Old to New</option>
                    <option value="users-high">Referred Users: High to Low</option>
                    <option value="commission-high">Commission: High to Low</option>
                </select>

                <Button variant="ghost" className="bg-[#1a2c38] hover:bg-[#2f4553] text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                </Button>

                <Button variant="ghost" className="bg-[#1a2c38] hover:bg-[#2f4553] text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>

                <div className="flex-1" />

                <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#1475e1] hover:bg-[#1266c9] text-white"
                >
                    Create Campaign
                </Button>
            </div>

            {/* Campaigns Table */}
            <Card className="bg-[#1a2c38] border-[#2f4553]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-[#2f4553]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Campaign</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Date Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-[#b1bad3]">
                                        Loading...
                                    </td>
                                </tr>
                            ) : campaigns && campaigns.length > 0 ? (
                                campaigns.map((campaign: any) => (
                                    <tr key={campaign.id} className="border-b border-[#2f4553] hover:bg-[#213743]">
                                        <td className="px-6 py-4 text-white">{campaign.name}</td>
                                        <td className="px-6 py-4 text-[#b1bad3]">
                                            {new Date(campaign.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-6 py-8 text-center text-[#b1bad3]">
                                        No campaigns yet. Create your first campaign to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {campaigns && campaigns.length > 0 && (
                    <div className="flex items-center justify-center gap-4 p-4 border-t border-[#2f4553]">
                        <Button variant="ghost" size="sm" disabled className="text-[#b1bad3]">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Previous
                        </Button>
                        <Button variant="ghost" size="sm" disabled className="text-[#b1bad3]">
                            Next
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                )}
            </Card>

            {/* Create Campaign Modal */}
            <CreateCampaignModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={createCampaign}
            />
        </div>
    );
}
