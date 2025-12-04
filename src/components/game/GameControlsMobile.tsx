import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Settings2 } from 'lucide-react';
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
        <div className="flex flex-col gap-4 p-4 bg-[#1a2c38] rounded-t-2xl border-t border-[#2f4553] shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-area-pb">

            {/* Bet Amount Input Group */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs text-[#b1bad3]">
                    <span className="font-bold">Bet Amount</span>
                    <span>${balance.toFixed(2)}</span>
                </div>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b1bad3] font-bold">$</div>
                    <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="bg-[#0f212e] border-[#2f4553] h-12 pl-7 pr-24 font-bold text-white text-lg focus-visible:ring-[#1475e1]"
                        placeholder="0.00"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleHalf}
                            className="h-full px-2 text-[#b1bad3] hover:text-white hover:bg-[#213743] font-bold text-xs"
                        >
                            ½
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDouble}
                            className="h-full px-2 text-[#b1bad3] hover:text-white hover:bg-[#213743] font-bold text-xs"
                        >
                            2x
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMax}
                            className="h-full px-2 text-[#b1bad3] hover:text-white hover:bg-[#213743] font-bold text-xs"
                        >
                            Max
                        </Button>
                    </div>
                </div>
            </div>

            {/* Game Specific Controls (e.g. Multiplier/Chance sliders) */}
            {children}

            {/* Action Button */}
            <div className="flex gap-3">
                <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="h-14 w-14 shrink-0 bg-[#0f212e] border-[#2f4553] hover:bg-[#213743] p-0"
                        >
                            <Settings2 className="w-6 h-6 text-[#b1bad3]" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 bg-[#1a2c38] border-[#2f4553] text-white p-4">
                        <div className="space-y-4">
                            <h4 className="font-bold text-sm">Game Settings</h4>
                            <div className="space-y-2">
                                <label className="text-xs text-[#b1bad3]">Max Bet</label>
                                <Input className="h-8 bg-[#0f212e] border-[#2f4553]" placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-[#b1bad3]">Auto Bet</label>
                                <Button variant="outline" size="sm" className="w-full border-[#2f4553] hover:bg-[#213743]">
                                    Configure Auto
                                </Button>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button
                    onClick={onBet}
                    disabled={isBetting || isMainButtonDisabled}
                    className={cn(
                        "flex-1 h-14 text-lg font-bold shadow-lg transition-all active:scale-95",
                        (isBetting || isMainButtonDisabled)
                            ? "bg-[#2f4553] cursor-not-allowed"
                            : "bg-[#00e701] hover:bg-[#00e701] text-black shadow-green-500/20"
                    )}
                >
                    {isBetting ? "Processing..." : mainButtonLabel}
                </Button>
            </div>
        </div>
    );
}
