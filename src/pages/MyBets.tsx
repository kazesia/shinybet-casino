import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Copy
} from "lucide-react";
import { useBets } from '@/hooks/useBets';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const MyBets = () => {
    const [activeTab, setActiveTab] = useState("casino");
    const [page, setPage] = useState(0);

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

    const copyBetId = (id: string) => {
        navigator.clipboard.writeText(id);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-6xl h-[90vh] bg-[#1a2c38] rounded-lg shadow-2xl flex flex-col overflow-hidden border border-[#2a3e4e]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2a3e4e]">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h2 className="text-lg font-bold text-white">My Bets</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-[#243642]"
                        onClick={() => window.history.back()}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Left Sidebar */}
                    <div className="w-48 bg-[#0f212e] border-r border-[#2a3e4e] p-3 flex flex-col gap-1">
                        <button
                            onClick={() => setActiveTab('casino')}
                            className={cn(
                                "px-4 py-2.5 text-left text-sm font-medium rounded transition-colors",
                                activeTab === 'casino'
                                    ? "bg-[#1a2c38] text-white border-l-2 border-[#1475e1]"
                                    : "text-gray-400 hover:text-white hover:bg-[#1a2c38]"
                            )}
                        >
                            Casino
                        </button>
                        <button
                            onClick={() => setActiveTab('sports')}
                            className={cn(
                                "px-4 py-2.5 text-left text-sm font-medium rounded transition-colors",
                                activeTab === 'sports'
                                    ? "bg-[#1a2c38] text-white border-l-2 border-[#1475e1]"
                                    : "text-gray-400 hover:text-white hover:bg-[#1a2c38]"
                            )}
                        >
                            Sports
                        </button>
                        <button
                            onClick={() => setActiveTab('archive')}
                            className={cn(
                                "px-4 py-2.5 text-left text-sm font-medium rounded transition-colors",
                                activeTab === 'archive'
                                    ? "bg-[#1a2c38] text-white border-l-2 border-[#1475e1]"
                                    : "text-gray-400 hover:text-white hover:bg-[#1a2c38]"
                            )}
                        >
                            Archive
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col">

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-[#0f212e] z-10">
                                    <TableRow className="border-b border-[#2a3e4e] hover:bg-[#0f212e]">
                                        <TableHead className="text-gray-400 font-medium text-xs">Game</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs">Bet ID</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs">Date</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs text-right">Bet Amount</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs text-right">Multiplier</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs text-right">Payout</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex items-center justify-center gap-2 text-gray-400">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Loading bets...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : bets.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-400">
                                                No bets found. Start playing to see your history!
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bets.map((bet) => (
                                            <TableRow
                                                key={bet.id}
                                                className="border-b border-[#2a3e4e] hover:bg-[#243642] transition-colors"
                                            >
                                                <TableCell className="font-medium text-white text-sm capitalize">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <circle cx="10" cy="10" r="8" />
                                                        </svg>
                                                        {bet.game_type}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer group">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <span className="font-mono text-xs truncate max-w-[120px]">
                                                            {bet.id.substring(0, 13)}
                                                        </span>
                                                        <Copy
                                                            className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => copyBetId(bet.id)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-gray-400 text-xs">
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
                                                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <circle cx="10" cy="10" r="8" />
                                                        </svg>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right text-gray-400 text-sm">
                                                    {bet.payout_credits > 0
                                                        ? (bet.payout_credits / bet.stake_credits).toFixed(2)
                                                        : '0.00'}x
                                                </TableCell>
                                                <TableCell className={cn(
                                                    "text-right font-medium text-sm",
                                                    bet.result === 'win' ? 'text-green-500' : 'text-gray-400'
                                                )}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {bet.result === 'win' ? '+' : ''}${bet.payout_credits.toFixed(2)}
                                                        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <circle cx="10" cy="10" r="8" />
                                                        </svg>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer with Pagination */}
                        <div className="flex items-center justify-between p-4 border-t border-[#2a3e4e] bg-[#0f212e]">
                            <div className="text-xs text-gray-400">
                                {totalCount > 0 ? `${totalCount} results · Page ${page + 1}` : '0 results'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-[#1a2c38] border-[#2a3e4e] text-gray-400 hover:text-white hover:bg-[#243642] h-8 px-3 text-xs"
                                    disabled={page === 0 || isLoading}
                                    onClick={handlePrevPage}
                                >
                                    <ChevronLeft className="w-3 h-3 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-[#1a2c38] border-[#2a3e4e] text-white hover:bg-[#243642] h-8 px-3 text-xs"
                                    disabled={page >= totalPages - 1 || isLoading}
                                    onClick={handleNextPage}
                                >
                                    Next
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyBets;
