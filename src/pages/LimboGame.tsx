import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, BarChart2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';

export default function LimboGame() {
    const { user } = useAuth();
    const { balance, optimisticUpdate } = useWallet();
    const { openFairnessModal } = useUI();

    // Game State
    const [betAmount, setBetAmount] = useState<number>(0);
    const [targetMultiplier, setTargetMultiplier] = useState<number>(2.00);
    const [isPlaying, setIsPlaying] = useState(false);
    const [lastResult, setLastResult] = useState<number | null>(null);
    const [lastWin, setLastWin] = useState<boolean | null>(null);
    const [mode, setMode] = useState<'manual' | 'auto'>('manual');

    const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setBetAmount(isNaN(val) ? 0 : val);
    };

    const adjustBet = (factor: number) => {
        setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
    };

    const handlePlay = async () => {
        if (!user) return toast.error("Please log in to play");
        if (betAmount <= 0) return toast.error("Invalid bet amount");
        if (betAmount > balance) return toast.error("Insufficient balance");
        if (targetMultiplier < 1.01) return toast.error("Target must be at least 1.01x");
        if (isPlaying) return;

        setIsPlaying(true);
        optimisticUpdate(-betAmount);

        // Simulate animation delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate result using house edge
        // Probability of winning = 0.99 / targetMultiplier
        // Generate random multiplier between 1.00 and a max value
        const houseEdge = 0.99;
        const winProbability = houseEdge / targetMultiplier;
        const randomValue = Math.random();

        // If random < winProbability, user wins
        const isWin = randomValue < winProbability;

        // Generate the actual multiplier shown
        let resultMultiplier: number;
        if (isWin) {
            // Generate a multiplier >= target
            resultMultiplier = targetMultiplier + (Math.random() * targetMultiplier * 0.5);
        } else {
            // Generate a multiplier < target
            resultMultiplier = 1.00 + (Math.random() * (targetMultiplier - 1.00));
        }

        const payout = isWin ? betAmount * targetMultiplier : 0;

        setLastResult(resultMultiplier);
        setLastWin(isWin);

        if (isWin) {
            optimisticUpdate(payout);
            toast.success(`Won ${payout.toFixed(4)}!`, { className: "text-yellow-500" });
        } else {
            toast.error(`Lost! ${resultMultiplier.toFixed(2)}x < ${targetMultiplier.toFixed(2)}x`);
        }

        // Sync to DB
        syncToDb(betAmount, payout, resultMultiplier, isWin);

        setIsPlaying(false);
    };

    const syncToDb = async (stake: number, payout: number, result: number, isWin: boolean) => {
        if (!user) return;

        try {
            const netChange = isWin ? (payout - stake) : -stake;
            const { error: walletError } = await supabase.rpc('increment_balance', { p_user_id: user.id, p_amount: netChange });
            if (walletError) {
                console.error("Wallet error:", walletError);
            }

            const { error: betError } = await supabase.from('bets').insert({
                user_id: user.id,
                game_type: 'Limbo',
                stake_credits: stake,
                payout_credits: payout,
                result: isWin ? 'win' : 'loss'
            });

            if (betError) {
                console.error("Bet error:", betError);
                toast.error(`Failed to save bet: ${betError.message}`);
            }
        } catch (e) {
            console.error("Unexpected error:", e);
        }
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">

                    {/* LEFT: Control Panel */}
                    <div className="w-full lg:w-[320px] bg-[#213743] p-4 flex flex-col gap-4 border-r border-[#1a2c38]">

                        {/* Mode Tabs */}
                        <div className="bg-[#0f212e] p-1 rounded-full flex">
                            <button
                                onClick={() => setMode('manual')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-bold rounded-full transition-all",
                                    mode === 'manual' ? "bg-[#2f4553] text-white shadow-md" : "text-[#b1bad3] hover:text-white"
                                )}
                            >
                                Manual
                            </button>
                            <button
                                onClick={() => setMode('auto')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-bold rounded-full transition-all",
                                    mode === 'auto' ? "bg-[#2f4553] text-white shadow-md" : "text-[#b1bad3] hover:text-white"
                                )}
                            >
                                Auto
                            </button>
                        </div>

                        {/* Bet Amount */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                                <span>Bet Amount</span>
                                <span>{betAmount.toFixed(8)} LTC</span>
                            </div>
                            <div className="relative flex items-center">
                                <Input
                                    type="number"
                                    value={betAmount}
                                    onChange={handleBetAmountChange}
                                    disabled={isPlaying}
                                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553] disabled:opacity-50"
                                />
                                <div className="absolute right-1 flex gap-1">
                                    <button onClick={() => adjustBet(0.5)} disabled={isPlaying} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">½</button>
                                    <button onClick={() => adjustBet(2)} disabled={isPlaying} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">2×</button>
                                </div>
                            </div>
                        </div>

                        {/* Target Multiplier */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-[#b1bad3]">Target Multiplier</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={targetMultiplier}
                                    onChange={(e) => setTargetMultiplier(parseFloat(e.target.value) || 1.01)}
                                    disabled={isPlaying}
                                    step="0.01"
                                    min="1.01"
                                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 focus:border-[#2f4553] focus:ring-0 disabled:opacity-50"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-xs font-bold pointer-events-none">×</span>
                            </div>
                        </div>

                        {/* Win Chance */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-[#b1bad3]">Win Chance</Label>
                            <Input
                                readOnly
                                value={`${((0.99 / targetMultiplier) * 100).toFixed(2)}%`}
                                className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 cursor-default focus-visible:ring-0"
                            />
                        </div>

                        {/* Potential Profit */}
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-[#b1bad3]">Potential Profit</Label>
                            <Input
                                readOnly
                                value={(betAmount * (targetMultiplier - 1)).toFixed(8)}
                                className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 cursor-default focus-visible:ring-0"
                            />
                        </div>

                        {/* Play Button */}
                        <Button
                            onClick={handlePlay}
                            disabled={isPlaying}
                            className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPlaying ? "Playing..." : "Bet"}
                        </Button>

                    </div>

                    {/* RIGHT: Game Area */}
                    <div className="flex-1 bg-[#0f212e] relative flex flex-col min-h-[500px]">

                        {/* Result Display */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                {lastResult !== null ? (
                                    <div className="animate-in fade-in zoom-in duration-500">
                                        <div className={cn(
                                            "text-8xl md:text-9xl font-black tracking-tighter tabular-nums mb-4",
                                            lastWin ? "text-[#FFD700]" : "text-[#ef4444]"
                                        )}>
                                            {lastResult.toFixed(2)}x
                                        </div>
                                        <div className={cn(
                                            "text-2xl font-bold uppercase",
                                            lastWin ? "text-[#FFD700]" : "text-[#ef4444]"
                                        )}>
                                            {lastWin ? "You Won!" : "You Lost"}
                                        </div>
                                        {lastWin && (
                                            <div className="text-[#b1bad3] mt-2">
                                                Target: {targetMultiplier.toFixed(2)}x
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-[#b1bad3] text-xl">
                                        Set your target and bet to play
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Controls */}
                        <div className="h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4 z-20">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                                    <Settings2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#F7D979]" /> Limbo
                            </div>

                            <div className="flex items-center gap-4">
                                <div
                                    className="flex items-center gap-2 bg-[#213743] px-3 py-1 rounded-full cursor-pointer hover:bg-[#2f4553] transition-colors"
                                    onClick={openFairnessModal}
                                >
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white">Fairness</span>
                                </div>
                                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                                    <BarChart2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}
