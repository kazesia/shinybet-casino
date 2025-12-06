import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    ChevronLeft,
    ChevronRight,
    Loader2,
    Copy
} from "lucide-react";
import { useBets } from '@/hooks/useBets';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BetDetailModal } from '@/components/bets/BetDetailModal';

const PAGE_SIZE = 10;

// Dollar icon component (same as LiveBets)
const CryptoIcon = () => (
    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 bg-[#00e701]">
        $
    </div>
);

// Game icon component using thumbnails (same as LiveBets)
const GameIcon = ({ type }: { type: string }) => {
    const normalizedType = type.toLowerCase().replace(' ', '');
    let src = '';

    switch (normalizedType) {
        case 'dice':
            src = '/game-assets/thumbnails/dice_new.png';
            break;
        case 'plinko':
            src = '/game-assets/thumbnails/plinko_new.jpg';
            break;
        case 'mines':
            src = '/game-assets/thumbnails/mines_new.jpg';
            break;
        case 'crash':
            src = '/game-assets/thumbnails/crash_new.jpg';
            break;
        case 'blackjack':
            src = '/game-assets/thumbnails/blackjack_new.jpg';
            break;
        case 'coinflip':
        case 'flip':
            src = '/game-assets/thumbnails/flip.png';
            break;
        case 'limbo':
            src = '/game-assets/thumbnails/limbo.png';
            break;
        case 'dragon-tower':
        case 'dragontower':
            src = '/game-assets/thumbnails/dragon-tower.png';
            break;
        default:
            src = '/game-assets/thumbnails/dice_new.png';
    }

    return (
        <img
            src={src}
            alt={type}
            className="w-5 h-5 rounded-md object-cover shadow-sm"
        />
    );
};

const MyBets = () => {
    const [activeTab, setActiveTab] = useState("casino");
    const [page, setPage] = useState(0);
    const [selectedBet, setSelectedBet] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data, isLoading } = useBets(
        activeTab === 'casino' ? 'all' : activeTab,
        page,
        PAGE_SIZE
    );

    const bets = data?.bets || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    const handleNextPage = () => {
        if (page < totalPages - 1) setPage(p => p + 1);
    };

    const handlePrevPage = () => {
        if (page > 0) setPage(p => p - 1);
    };

    const copyBetId = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        toast.success('Bet ID copied to clipboard');
    };

    const openBetModal = (bet: any) => {
        setSelectedBet(bet);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1a2c38] rounded-lg border border-[#2f4553]">
                        <img src="/icons/mybets.png" alt="My Bets" className="w-5 h-5" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">My Bets</h1>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Sidebar */}
                    <Card className="lg:w-48 bg-[#1a2c38] border-[#2f4553] p-3">
                        <div className="flex flex-row lg:flex-col gap-2">
                            <button
                                onClick={() => { setActiveTab('casino'); setPage(0); }}
                                className={cn(
                                    "px-4 py-2.5 text-left text-sm font-medium rounded transition-all",
                                    activeTab === 'casino'
                                        ? "bg-[#2f4553] text-white shadow-md"
                                        : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                                )}
                            >
                                Casino
                            </button>
                            <button
                                onClick={() => { setActiveTab('sports'); setPage(0); }}
                                className={cn(
                                    "px-4 py-2.5 text-left text-sm font-medium rounded transition-all",
                                    activeTab === 'sports'
                                        ? "bg-[#2f4553] text-white shadow-md"
                                        : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                                )}
                            >
                                Sports
                            </button>
                            <button
                                onClick={() => { setActiveTab('archive'); setPage(0); }}
                                className={cn(
                                    "px-4 py-2.5 text-left text-sm font-medium rounded transition-all",
                                    activeTab === 'archive'
                                        ? "bg-[#2f4553] text-white shadow-md"
                                        : "text-[#b1bad3] hover:text-white hover:bg-[#213743]"
                                )}
                            >
                                Archive
                            </button>
                        </div>
                    </Card>

                    {/* Main Table */}
                    <Card className="flex-1 bg-[#1a2c38] border-[#2f4553] overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-[#0f212e]">
                                    <TableRow className="border-b border-[#2f4553] hover:bg-[#0f212e]">
                                        <TableHead className="text-[#b1bad3] font-medium text-xs uppercase">Game</TableHead>
                                        <TableHead className="text-[#b1bad3] font-medium text-xs uppercase">Bet ID</TableHead>
                                        <TableHead className="text-[#b1bad3] font-medium text-xs uppercase">Date</TableHead>
                                        <TableHead className="text-[#b1bad3] font-medium text-xs uppercase text-right">Bet Amount</TableHead>
                                        <TableHead className="text-[#b1bad3] font-medium text-xs uppercase text-right">Multiplier</TableHead>
                                        <TableHead className="text-[#b1bad3] font-medium text-xs uppercase text-right">Payout</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex items-center justify-center gap-2 text-[#b1bad3]">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Loading bets...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : bets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-[#b1bad3]">
                                                No bets found. Start playing to see your history!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bets.map((bet) => (
                                            <TableRow
                                                key={bet.id}
                                                className="border-b border-[#2f4553] hover:bg-[#213743] transition-colors"
                                            >
                                                <TableCell className="font-medium text-white text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <GameIcon type={bet.game_type} />
                                                        <span className="capitalize">{bet.game_type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className="flex items-center gap-2 text-[#1475e1] hover:text-white cursor-pointer group"
                                                        onClick={() => openBetModal(bet)}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span className="font-mono text-xs truncate max-w-[120px] underline">
                                                            {bet.id.substring(0, 13)}
                                                        </span>
                                                        <Copy
                                                            className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => copyBetId(e, bet.id)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-[#b1bad3] text-xs">
                                                    {new Date(bet.created_at).toLocaleString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                        month: 'numeric',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-white text-sm">
                                                    <div className="flex items-center justify-end gap-1">
                                                        ${bet.stake_credits.toFixed(2)}
                                                        <CryptoIcon />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-[#b1bad3] text-sm font-mono">
                                                    {bet.payout_credits > 0
                                                        ? (bet.payout_credits / bet.stake_credits).toFixed(2)
                                                        : '0.00'}x
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-medium text-sm",
                                                    bet.result === 'win' ? 'text-[#00e701]' : 'text-[#b1bad3]'
                                                )}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {bet.result === 'win' ? '+' : ''}${bet.payout_credits.toFixed(2)}
                                                        <CryptoIcon />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer with Pagination */}
                        <div className="flex items-center justify-between p-4 border-t border-[#2f4553] bg-[#0f212e]">
                            <div className="text-xs text-[#b1bad3]">
                                {totalCount > 0 ? `${totalCount} results · Page ${page + 1}` : '0 results'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-[#1a2c38] border-[#2f4553] text-[#b1bad3] hover:text-white hover:bg-[#213743] h-8 px-3 text-xs"
                                    disabled={page === 0 || isLoading}
                                    onClick={handlePrevPage}
                                >
                                    <ChevronLeft className="w-3 h-3 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-[#1a2c38] border-[#2f4553] text-white hover:bg-[#213743] h-8 px-3 text-xs"
                                    disabled={page >= totalPages - 1 || isLoading}
                                    onClick={handleNextPage}
                                >
                                    Next
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Bet Detail Modal */}
            <BetDetailModal
                bet={selectedBet}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default MyBets;
