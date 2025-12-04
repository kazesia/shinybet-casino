import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentBets, BetTab } from '@/hooks/useRecentBets';
import { BetRow } from './BetRow';
import { BetDetailDrawer } from './BetDetailDrawer';
import { BetsFilters } from './BetsFilters';

const TABS: { id: BetTab; label: string }[] = [
    { id: 'my', label: 'My Bets' },
    { id: 'all', label: 'All Bets' },
    { id: 'high', label: 'High Rollers' },
    { id: 'race', label: 'Race Leaderboard' },
];

export function RecentBetsList() {
    const [activeTab, setActiveTab] = useState<BetTab>('all');
    const [pageSize, setPageSize] = useState(20);
    const [gameFilter, setGameFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [selectedBetId, setSelectedBetId] = useState<string | null>(null);
    const [newBetIds, setNewBetIds] = useState<Set<string>>(new Set());

    const { bets, loading, hasMore, totalCount, loadMore, isAdmin } = useRecentBets({
        tab: activeTab,
        pageSize,
        gameFilter,
        searchQuery,
        timeFilter
    });

    const selectedBet = bets.find(b => b.id === selectedBetId);

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                activeTab === tab.id
                                    ? "bg-[#ffd700] text-black"
                                    : "bg-[#1a2c38] text-[#b1bad3] hover:bg-[#213743] hover:text-white"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                    <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="bg-[#1a2c38] border border-[#2f4553] text-white rounded-lg px-3 py-2 text-sm"
                    >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Filters */}
            <BetsFilters
                gameFilter={gameFilter}
                setGameFilter={setGameFilter}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                timeFilter={timeFilter}
                setTimeFilter={setTimeFilter}
            />

            {/* Table */}
            <Card className="bg-[#0f212e] border-[#2f4553] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#1a2c38] border-b border-[#2f4553]">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-[#b1bad3] uppercase tracking-wider">
                                    Game
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-[#b1bad3] uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-[#b1bad3] uppercase tracking-wider">
                                    Bet Amount
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium text-[#b1bad3] uppercase tracking-wider">
                                    Multiplier
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium text-[#b1bad3] uppercase tracking-wider">
                                    Payout
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && bets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#b1bad3]" />
                                    </td>
                                </tr>
                            ) : bets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#b1bad3]">
                                        No bets found
                                    </td>
                                </tr>
                            ) : (
                                bets.map((bet) => (
                                    <BetRow
                                        key={bet.id}
                                        bet={bet}
                                        isNew={newBetIds.has(bet.id)}
                                        onClick={() => setSelectedBetId(bet.id)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Load More */}
                {hasMore && !loading && (
                    <div className="p-4 border-t border-[#2f4553] flex justify-center">
                        <Button
                            onClick={loadMore}
                            variant="outline"
                            className="bg-[#1a2c38] border-[#2f4553] text-white hover:bg-[#213743]"
                        >
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Load More
                        </Button>
                    </div>
                )}

                {/* Footer */}
                <div className="px-6 py-3 bg-[#1a2c38] border-t border-[#2f4553] flex justify-between items-center">
                    <span className="text-xs text-[#b1bad3]">
                        {totalCount > 0 ? `${totalCount} total bets` : 'No bets'}
                    </span>
                    <span className="text-xs text-[#b1bad3]">
                        Showing {bets.length} of {totalCount}
                    </span>
                </div>
            </Card>

            {/* Detail Drawer */}
            {selectedBet && (
                <BetDetailDrawer
                    bet={selectedBet}
                    isOpen={!!selectedBetId}
                    onClose={() => setSelectedBetId(null)}
                />
            )}
        </div>
    );
}
