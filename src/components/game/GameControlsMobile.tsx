import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Settings2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface GameControlsMobileProps {
    betAmount: string;
    setBetAmount: (amount: string) => void;
    onBet: () => void;
    isBetting: boolean;
    balance: number;
    multiplier?: number;
    setMultiplier?: (multiplier: number) => void;
    winChance?: number;
    setWinChance?: (chance: number) => void;
    children?: React.ReactNode; // For extra game-specific controls
    mainButtonLabel?: string;
    isMainButtonDisabled?: boolean;
}

export function GameControlsMobile({
    betAmount,
    setBetAmount,
    onBet,
    isBetting,
    balance,
    multiplier,
    setMultiplier,
    winChance,
    setWinChance,
    children,
    mainButtonLabel = "Bet",
    isMainButtonDisabled = false
}: GameControlsMobileProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleHalf = () => {
        const val = parseFloat(betAmount) / 2;
        setBetAmount(val.toFixed(2));
    };

    const handleDouble = () => {
        const val = parseFloat(betAmount) * 2;
        if (val > balance) {
            setBetAmount(balance.toFixed(2));
        } else {
            setBetAmount(val.toFixed(2));
        }
    };

    const handleMax = () => {
        setBetAmount(balance.toFixed(2));
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-[#1a2c38] rounded-t-2xl border-t border-[#2f4553] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-area-pb">

            {/* Main Bet Button - Moved to top for prominence */}
            <Button
                onClick={onBet}
                disabled={isBetting || isMainButtonDisabled}
                className={cn(
                    "w-full h-14 text-lg font-bold shadow-lg transition-all active:scale-95 rounded-lg",
                    (isBetting || isMainButtonDisabled)
                        ? "bg-[#2f4553] cursor-not-allowed text-[#b1bad3]"
                        : "bg-[#00e701] hover:bg-[#00d801] text-black shadow-[0_0_20px_rgba(0,231,1,0.3)]"
                )}
            >
                {isBetting ? "Processing..." : mainButtonLabel}
            </Button>

            {/* Bet Amount Section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-[#b1bad3] font-medium">Bet Amount</span>
                    <span className="text-white font-mono">{parseFloat(betAmount || '0').toFixed(8)} SOL</span>
                </div>
                <div className="relative">
                    <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="bg-[#0f212e] border-[#2f4553] h-12 pr-32 font-mono text-white text-base focus-visible:ring-[#00e701] focus-visible:border-[#00e701] rounded-lg"
                        placeholder="0.00"
                        step="0.01"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleHalf}
                            className="h-8 px-3 text-[#b1bad3] hover:text-white hover:bg-[#213743] font-bold text-xs rounded-md"
                        >
                            ½
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDouble}
                            className="h-8 px-3 text-[#b1bad3] hover:text-white hover:bg-[#213743] font-bold text-xs rounded-md"
                        >
                            2×
                        </Button>
                    </div>
                </div>
            </div>

            {/* Game Specific Controls (e.g. Mines/Gems, Risk/Rows) */}
            {children}

            {/* Random Pick Button (if applicable) */}
            {/* This can be added by individual games via children prop */}

        </div>
    );
}
