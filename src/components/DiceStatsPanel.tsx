import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import type { AutoBetStats } from '@/hooks/useEnhancedAutoBet';

interface DiceStatsPanelProps {
    stats: AutoBetStats;
    isRunning?: boolean;
}

export function DiceStatsPanel({ stats, isRunning = false }: DiceStatsPanelProps) {
    return (
        <Card className="bg-[#1a2c38] border-[#2f4553] p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#1475e1]" />
                    Live Stats
                    {isRunning && (
                        <Badge variant="outline" className="border-green-500 text-green-500 animate-pulse">
                            Running
                        </Badge>
                    )}
                </h3>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#0f212e] rounded p-3">
                    <p className="text-xs text-[#b1bad3] mb-1">Profit</p>
                    <p className={`text-lg font-bold ${stats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${stats.totalProfit.toFixed(2)}
                    </p>
                </div>

                <div className="bg-[#0f212e] rounded p-3">
                    <p className="text-xs text-[#b1bad3] mb-1">Wins</p>
                    <p className="text-lg font-bold text-white">{stats.wins}</p>
                </div>

                <div className="bg-[#0f212e] rounded p-3">
                    <p className="text-xs text-[#b1bad3] mb-1">Wagered</p>
                    <p className="text-lg font-bold text-white">${stats.totalWagered.toFixed(2)}</p>
                </div>

                <div className="bg-[#0f212e] rounded p-3">
                    <p className="text-xs text-[#b1bad3] mb-1">Losses</p>
                    <p className="text-lg font-bold text-white">{stats.losses}</p>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-[#b1bad3]">Win Rate</span>
                    <span className="font-bold text-white">{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#b1bad3]">Average Wager</span>
                    <span className="font-bold text-white">${stats.averageWager.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#b1bad3]">Longest Win Streak</span>
                    <span className="font-bold text-green-500">{stats.longestWinStreak}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-[#b1bad3]">Longest Loss Streak</span>
                    <span className="font-bold text-red-500">{stats.longestLossStreak}</span>
                </div>
                {stats.biggestWin > 0 && (
                    <div className="flex justify-between">
                        <span className="text-[#b1bad3]">Biggest Win</span>
                        <span className="font-bold text-green-500">${stats.biggestWin.toFixed(2)}</span>
                    </div>
                )}
                {stats.biggestLoss > 0 && (
                    <div className="flex justify-between">
                        <span className="text-[#b1bad3]">Biggest Loss</span>
                        <span className="font-bold text-red-500">${stats.biggestLoss.toFixed(2)}</span>
                    </div>
                )}
                {stats.currentStreak !== 0 && (
                    <div className="flex justify-between">
                        <span className="text-[#b1bad3]">Current Streak</span>
                        <span className={`font-bold ${stats.currentStreak > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Math.abs(stats.currentStreak)} {stats.currentStreak > 0 ? 'wins' : 'losses'}
                        </span>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {stats.history.length === 0 && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[#0f212e] rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-[#2f4553]" />
                    </div>
                    <p className="text-sm text-[#b1bad3]">No bets placed yet</p>
                    <p className="text-xs text-[#2f4553] mt-1">Start betting to see live stats</p>
                </div>
            )}
        </Card>
    );
}
