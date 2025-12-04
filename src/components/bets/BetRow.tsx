import { motion } from 'framer-motion';
import { Dices, Zap, Flame, TrendingUp, Spade, UserIcon, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BetData } from '@/hooks/useRecentBets';

interface BetRowProps {
    bet: BetData;
    isNew?: boolean;
    onClick: () => void;
}

const getGameIcon = (gameType: string) => {
    const type = gameType.toLowerCase();
    switch (type) {
        case 'dice':
            return <Dices className="w-4 h-4" />;
        case 'plinko':
            return <Zap className="w-4 h-4" />;
        case 'mines':
            return <Flame className="w-4 h-4" />;
        case 'crash':
            return <TrendingUp className="w-4 h-4" />;
        case 'blackjack':
            return <Spade className="w-4 h-4" />;
        case 'coinflip':
        case 'coin flip':
            return <UserIcon className="w-4 h-4" />;
        default:
            return <Dices className="w-4 h-4" />;
    }
};

export function BetRow({ bet, isNew, onClick }: BetRowProps) {
    const multiplier = bet.stake_credits > 0 ? bet.payout_credits / bet.stake_credits : 0;
    const isWin = bet.payout_credits > bet.stake_credits;
    const isBigWin = bet.payout_credits > bet.stake_credits * 10;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <motion.tr
            initial={isNew ? { opacity: 0, y: -10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClick}
            className={cn(
                "border-b border-[#2f4553] hover:bg-[#213743] transition-all cursor-pointer group",
                isNew && "bg-[#ffd700]/5"
            )}
        >
            {/* Game */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="text-[#b1bad3]">
                        {getGameIcon(bet.game_type)}
                    </div>
                    <span className="text-white font-medium capitalize">{bet.game_type}</span>
                </div>
            </td>

            {/* Time */}
            <td className="px-6 py-4">
                <span className="text-[#b1bad3] text-sm">{formatTime(bet.created_at)}</span>
            </td>

            {/* Bet Amount */}
            <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-1">
                    <span className="text-white font-medium">${bet.stake_credits.toFixed(2)}</span>
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" />
                    </svg>
                </div>
            </td>

            {/* Multiplier */}
            <td className="px-6 py-4 text-center">
                <span className="text-[#b1bad3] font-mono">{multiplier.toFixed(2)}x</span>
            </td>

            {/* Payout */}
            <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                    <span className={cn(
                        "font-medium font-mono",
                        isWin ? "text-[#2CE38F]" : "text-[#b1bad3]"
                    )}>
                        {isWin && '+'}${bet.payout_credits.toFixed(2)}
                    </span>
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="8" />
                    </svg>
                    {isBigWin && (
                        <Trophy className="w-4 h-4 text-[#ffd700]" />
                    )}
                </div>
            </td>
        </motion.tr>
    );
}
