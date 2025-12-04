import { Bet } from '@/types';
import { cn } from '@/lib/utils';
import { Dices, Zap, Flame, TrendingUp, Spade, User as UserIcon, Trophy } from 'lucide-react';

interface BetCardProps {
    bet: Bet;
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

export function BetCard({ bet }: BetCardProps) {
    const isWin = bet.payout_credits > bet.stake_credits;
    const multiplier = bet.stake_credits > 0 ? bet.payout_credits / bet.stake_credits : 0;

    return (
        <div className="bg-[#1a2c38] border border-[#2f4553] rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isWin ? "bg-[#00e701]/10 text-[#00e701]" : "bg-[#2f4553] text-[#b1bad3]"
                )}>
                    {getGameIcon(bet.game_type)}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white capitalize">{bet.game_type}</span>
                    <span className="text-xs text-[#b1bad3]">{new Date(bet.created_at).toLocaleTimeString()}</span>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <div className={cn(
                    "font-bold font-mono text-sm",
                    isWin ? "text-[#00e701]" : "text-[#b1bad3]"
                )}>
                    {isWin ? `+$${bet.payout_credits.toFixed(2)}` : `-$${bet.stake_credits.toFixed(2)}`}
                </div>
                <div className="text-xs text-[#b1bad3] font-mono">
                    {multiplier.toFixed(2)}x
                </div>
            </div>
        </div>
    );
}
