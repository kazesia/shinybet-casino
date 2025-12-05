/**
 * Dice Feed Component
 * 
 * Real-time feed of public dice bets.
 * Subscribes to Supabase realtime updates.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { formatNumber, type DiceBet } from '@/lib/provablyFair';

interface DiceFeedProps {
    maxItems?: number;
    showAmount?: boolean;
}

export const DiceFeed: React.FC<DiceFeedProps> = ({
    maxItems = 10,
    showAmount = true,
}) => {
    const [bets, setBets] = useState<DiceBet[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch initial bets
    useEffect(() => {
        const fetchBets = async () => {
            const { data, error } = await supabase
                .from('dice_bets')
                .select('*')
                .eq('is_public', true)
                .order('created_at', { ascending: false })
                .limit(maxItems);

            if (!error && data) {
                setBets(data as DiceBet[]);
            }
            setIsLoading(false);
        };

        fetchBets();
    }, [maxItems]);

    // Subscribe to realtime updates
    useEffect(() => {
        const channel = supabase
            .channel('public_dice_bets')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'dice_bets',
                    filter: 'is_public=eq.true'
                },
                (payload) => {
                    setBets(prev => [payload.new as DiceBet, ...prev].slice(0, maxItems));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [maxItems]);

    if (isLoading) {
        return (
            <div className="bg-[#1a2c38] rounded-lg border border-[#243442] p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#FFD700]" />
                    <span className="text-sm font-bold text-white">Live Dice Bets</span>
                </div>
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 bg-[#213743] rounded animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1a2c38] rounded-lg border border-[#243442] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[#243442]">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Zap className="w-4 h-4 text-[#FFD700]" />
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </div>
                    <span className="text-sm font-bold text-white">Live Dice Bets</span>
                </div>
                <span className="text-xs text-[#b1bad3]">{bets.length} recent</span>
            </div>

            {/* Feed */}
            <div className="divide-y divide-[#243442] max-h-[300px] overflow-y-auto">
                <AnimatePresence initial={false}>
                    {bets.map((bet, index) => (
                        <motion.div
                            key={bet.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-3 flex items-center justify-between hover:bg-[#213743] transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {/* Win/Loss Icon */}
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center",
                                    bet.won ? "bg-[#00e701]/20" : "bg-[#ed4245]/20"
                                )}>
                                    {bet.won ? (
                                        <TrendingUp className="w-3.5 h-3.5 text-[#00e701]" />
                                    ) : (
                                        <TrendingDown className="w-3.5 h-3.5 text-[#ed4245]" />
                                    )}
                                </div>

                                {/* Bet Info */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-sm font-bold",
                                            bet.won ? "text-[#00e701]" : "text-white"
                                        )}>
                                            {bet.roll_result.toFixed(2)}
                                        </span>
                                        <span className="text-xs text-[#557086]">
                                            {bet.roll_condition === 'over' ? '>' : '<'} {bet.target.toFixed(2)}
                                        </span>
                                    </div>
                                    {showAmount && (
                                        <div className="text-xs text-[#557086]">
                                            {formatNumber(bet.bet_amount, 4)} @ {bet.multiplier.toFixed(2)}x
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profit/Loss */}
                            <div className="text-right">
                                <div className={cn(
                                    "text-sm font-bold",
                                    bet.won ? "text-[#00e701]" : "text-[#ed4245]"
                                )}>
                                    {bet.won ? '+' : ''}{formatNumber(bet.profit, 4)}
                                </div>
                                <div className="text-xs text-[#557086]">
                                    {new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {bets.length === 0 && (
                    <div className="p-8 text-center text-[#b1bad3]">
                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No bets yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiceFeed;
