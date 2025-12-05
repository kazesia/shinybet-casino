import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Filter, Download, ChevronLeft, ChevronRight, Info } from 'lucide-react';

interface AffiliateReferredUsersProps {
    affiliate: any;
}

export function AffiliateReferredUsers({ affiliate }: AffiliateReferredUsersProps) {
    const { referredUsers, loading } = affiliate;
    const [sortBy, setSortBy] = useState('deposits-high');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Referred Users</h2>
                <p className="text-[#b1bad3]">
                    Track all the users who joined through your referral link. Here you can see their activity and gameplay - making it easy to monitor the growth of your network and the benefits you're gaining from referrals.
                </p>
            </div>

            {/* Stats Row */}
            <div className="bg-[#1a2c38] rounded-lg p-4">
                <div className="flex items-center gap-2">
                    <span className="text-[#b1bad3] text-sm">Total Referred Users:</span>
                    <span className="text-white font-bold">{referredUsers?.length || 0}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">First Time Deposits (FTD)</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">0</div>
                </div>

                <div className="bg-[#1a2c38] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#b1bad3] text-sm">Monthly FTD</span>
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
                        <span className="text-[#b1bad3] text-sm">VIP Users</span>
                        <Info className="w-3 h-3 text-[#b1bad3]" />
                    </div>
                    <div className="text-2xl font-bold text-white">0</div>
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
                    <option value="deposits-high">Total Deposits: High to Low</option>
                    <option value="deposits-low">Total Deposits: Low to High</option>
                    <option value="wagered-high">Total Wagered: High to Low</option>
                    <option value="date-new">Join Date: New to Old</option>
                </select>

                <Button variant="ghost" className="bg-[#1a2c38] hover:bg-[#2f4553] text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Users Table */}
            <Card className="bg-[#1a2c38] border-[#2f4553]">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-[#2f4553]">
                            <tr>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Username</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Join Date</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Total Deposits</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">Total Wagered</th>
                                <th className="text-left px-6 py-4 text-[#b1bad3] font-medium text-sm">VIP Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-[#b1bad3]">
                                        Loading...
                                    </td>
                                </tr>
                            ) : referredUsers && referredUsers.length > 0 ? (
                                referredUsers.map((user: any) => (
                                    <tr key={user.id} className="border-b border-[#2f4553] hover:bg-[#213743]">
                                        <td className="px-6 py-4 text-white font-medium">
                                            {user.username?.replace(/./g, '*').slice(0, -2) + user.username?.slice(-2)}
                                        </td>
                                        <td className="px-6 py-4 text-[#b1bad3]">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-white">${user.total_deposits?.toFixed(2) || '0.00'}</td>
                                        <td className="px-6 py-4 text-white">${user.total_wagered?.toFixed(2) || '0.00'}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-[#b1bad3]/10 text-[#b1bad3] rounded text-xs font-medium">
                                                {user.vip_level || 'Bronze'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-[#b1bad3]">
                                        No referred users yet. Share your referral link to get started!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {referredUsers && referredUsers.length > 0 && (
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
        </div>
    );
}
