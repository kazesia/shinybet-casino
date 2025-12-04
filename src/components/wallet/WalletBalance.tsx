import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Wallet as WalletIcon } from 'lucide-react';
import { formatCompact, formatFull, interpolate, easeOutCubic } from '@/utils/format';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WalletBalanceProps {
    balance: number;
    currency?: string;
    compact?: boolean;
    showDropdown?: boolean;
    onDeposit?: () => void;
    onWithdraw?: () => void;
    onHistory?: () => void;
    className?: string;
}

export function WalletBalance({
    balance,
    currency = 'SHY',
    compact = true,
    showDropdown = true,
    onDeposit,
    onWithdraw,
    onHistory,
    className
}: WalletBalanceProps) {
    const [displayBalance, setDisplayBalance] = useState(balance);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const prevBalanceRef = useRef(balance);
    const animationFrameRef = useRef<number>();

    // Animate balance changes
    useEffect(() => {
        const prevBalance = prevBalanceRef.current;

        if (prevBalance !== balance) {
            setIsAnimating(true);
            const startTime = Date.now();
            const duration = 400; // 400ms animation

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutCubic(progress);

                const currentValue = interpolate(prevBalance, balance, easedProgress);
                setDisplayBalance(currentValue);

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setDisplayBalance(balance);
                    setIsAnimating(false);
                    prevBalanceRef.current = balance;
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [balance]);

    const formattedCompact = formatCompact(displayBalance);
    const formattedFull = formatFull(balance);

    const BalanceDisplay = () => (
        <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f212e] border border-[#2f4553]",
            "hover:border-[#ffd700] hover:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all duration-300",
            isAnimating && "animate-pulse",
            className
        )}>
            <div className="flex items-center gap-2">
                <span className="text-xs text-[#b1bad3]">$</span>
                <Popover open={showTooltip} onOpenChange={setShowTooltip}>
                    <PopoverTrigger asChild>
                        <button
                            className="font-bold text-white text-sm hover:text-[#ffd700] transition-colors"
                            onMouseEnter={() => setShowTooltip(true)}
                            onMouseLeave={() => setShowTooltip(false)}
                        >
                            {formattedCompact}
                        </button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="bg-[#1a2c38] border-[#2f4553] text-white p-3 w-auto"
                        side="bottom"
                        align="center"
                    >
                        <div className="space-y-1">
                            <div className="text-xs text-[#b1bad3]">Full Balance</div>
                            <div className="font-mono text-sm font-bold text-[#ffd700]">
                                {formattedFull} {currency}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                <WalletIcon className="w-4 h-4 text-[#ffd700]" />
            </div>

            {showDropdown && (
                <ChevronDown className="w-4 h-4 text-[#b1bad3]" />
            )}
        </div>
    );

    if (!showDropdown) {
        return <BalanceDisplay />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                    <BalanceDisplay />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="bg-[#1a2c38] border-[#2f4553] text-white"
                align="end"
            >
                {onDeposit && (
                    <DropdownMenuItem
                        onClick={onDeposit}
                        className="hover:bg-[#213743] cursor-pointer"
                    >
                        <span className="text-green-400 mr-2">+</span>
                        Deposit
                    </DropdownMenuItem>
                )}
                {onWithdraw && (
                    <DropdownMenuItem
                        onClick={onWithdraw}
                        className="hover:bg-[#213743] cursor-pointer"
                    >
                        <span className="text-red-400 mr-2">-</span>
                        Withdraw
                    </DropdownMenuItem>
                )}
                {onHistory && (
                    <DropdownMenuItem
                        onClick={onHistory}
                        className="hover:bg-[#213743] cursor-pointer"
                    >
                        <WalletIcon className="w-4 h-4 mr-2" />
                        History
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Loading skeleton component
export function WalletBalanceSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f212e] border border-[#2f4553]",
            "animate-pulse",
            className
        )}>
            <div className="h-4 w-16 bg-[#2f4553] rounded" />
            <div className="w-4 h-4 bg-[#2f4553] rounded-full" />
        </div>
    );
}
