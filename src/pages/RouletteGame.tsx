import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, BarChart2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';

// Roulette numbers with colors (European Roulette: 0-36)
const ROULETTE_NUMBERS = [
    { num: 0, color: 'green' },
    { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' }, { num: 4, color: 'black' },
    { num: 21, color: 'red' }, { num: 2, color: 'black' }, { num: 25, color: 'red' }, { num: 17, color: 'black' },
    { num: 34, color: 'red' }, { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
    { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' }, { num: 8, color: 'black' },
    { num: 23, color: 'red' }, { num: 10, color: 'black' }, { num: 5, color: 'red' }, { num: 24, color: 'black' },
    { num: 16, color: 'red' }, { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
    { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' }, { num: 22, color: 'black' },
    { num: 18, color: 'red' }, { num: 29, color: 'black' }, { num: 7, color: 'red' }, { num: 28, color: 'black' },
    { num: 12, color: 'red' }, { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' }
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

type BetType = 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'number';

interface Bet {
    type: BetType;
    value?: number;
    amount: number;
}

export default function RouletteGame() {
    const { user } = useAuth();
    const { balance, optimisticUpdate } = useWallet();
    const { openFairnessModal } = useUI();

    const [betAmount, setBetAmount] = useState<number>(0);
    const [bets, setBets] = useState<Bet[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<number | null>(null);
    const [mode, setMode] = useState<'manual' | 'auto'>('manual');

    const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setBetAmount(isNaN(val) ? 0 : val);
    };

    const adjustBet = (factor: number) => {
        setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
    };

    const placeBet = (type: BetType, value?: number) => {
        if (betAmount <= 0) return toast.error("Set a bet amount first");
        if (betAmount > balance) return toast.error("Insufficient balance");

        const newBet: Bet = { type, value, amount: betAmount };
        setBets(prev => [...prev, newBet]);
        toast.success(`Placed ${betAmount.toFixed(4)} on ${type}${value !== undefined ? ` ${value}` : ''}`);
    };

    const clearBets = () => {
        setBets([]);
        toast.info("Bets cleared");
    };

    const getTotalBetAmount = () => {
        return bets.reduce((sum, bet) => sum + bet.amount, 0);
    };

    const spin = async () => {
        if (!user) return toast.error("Please log in to play");
        if (bets.length === 0) return toast.error("Place at least one bet");
        if (isSpinning) return;

        const totalBet = getTotalBetAmount();
        if (totalBet > balance) return toast.error("Insufficient balance for all bets");

        setIsSpinning(true);
        optimisticUpdate(-totalBet);

        // Simulate spin animation
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate random result
        const result = Math.floor(Math.random() * 37); // 0-36
        setLastResult(result);

        // Calculate winnings
        let totalPayout = 0;
        bets.forEach(bet => {
            let won = false;
            let multiplier = 0;

            switch (bet.type) {
                case 'red':
                    won = RED_NUMBERS.includes(result);
                    multiplier = 2;
                    break;
                case 'black':
                    won = BLACK_NUMBERS.includes(result);
                    multiplier = 2;
                    break;
                case 'odd':
                    won = result > 0 && result % 2 === 1;
                    multiplier = 2;
                    break;
                case 'even':
                    won = result > 0 && result % 2 === 0;
                    multiplier = 2;
                    break;
                case 'low':
                    won = result >= 1 && result <= 18;
                    multiplier = 2;
                    break;
                case 'high':
                    won = result >= 19 && result <= 36;
                    multiplier = 2;
                    break;
                case 'number':
                    won = result === bet.value;
                    multiplier = 36;
                    break;
            }

            if (won) {
                totalPayout += bet.amount * multiplier;
            }
        });

        const netProfit = totalPayout - totalBet;
        const isWin = totalPayout > 0;

        if (isWin) {
            optimisticUpdate(totalPayout);
            toast.success(`Won ${totalPayout.toFixed(4)}!`, { className: "text-yellow-500" });
        } else {
            toast.error(`Lost! Number was ${result}`);
        }

        // Sync to DB
        await syncToDb(totalBet, totalPayout, result, isWin);

        setBets([]);
        setIsSpinning(false);
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
                game_type: 'Roulette',
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

    const getNumberColor = (num: number) => {
        if (num === 0) return 'green';
        return RED_NUMBERS.includes(num) ? 'red' : 'black';
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
                                    disabled={isSpinning}
                                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553] disabled:opacity-50"
                                />
                                <div className="absolute right-1 flex gap-1">
                                    <button onClick={() => adjustBet(0.5)} disabled={isSpinning} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">½</button>
                                    <button onClick={() => adjustBet(2)} disabled={isSpinning} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">2×</button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Bets */}
                        <div className="space-y-2">
                            <div className="text-xs font-bold text-[#b1bad3]">Quick Bets</div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => placeBet('red')} disabled={isSpinning} className="bg-red-600 hover:bg-red-700 text-white font-bold h-10">Red (2x)</Button>
                                <Button onClick={() => placeBet('black')} disabled={isSpinning} className="bg-black hover:bg-gray-900 text-white font-bold h-10">Black (2x)</Button>
                                <Button onClick={() => placeBet('odd')} disabled={isSpinning} className="bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold h-10">Odd (2x)</Button>
                                <Button onClick={() => placeBet('even')} disabled={isSpinning} className="bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold h-10">Even (2x)</Button>
                                <Button onClick={() => placeBet('low')} disabled={isSpinning} className="bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold h-10">1-18 (2x)</Button>
                                <Button onClick={() => placeBet('high')} disabled={isSpinning} className="bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold h-10">19-36 (2x)</Button>
                            </div>
                        </div>

                        {/* Current Bets */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                                <span>Active Bets</span>
                                <span>{bets.length}</span>
                            </div>
                            <div className="bg-[#0f212e] rounded p-2 max-h-32 overflow-y-auto">
                                {bets.length === 0 ? (
                                    <div className="text-xs text-[#b1bad3]/50 text-center py-2">No bets placed</div>
                                ) : (
                                    bets.map((bet, i) => (
                                        <div key={i} className="text-xs text-white mb-1">
                                            {bet.amount.toFixed(4)} on {bet.type}{bet.value !== undefined ? ` ${bet.value}` : ''}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <Button
                            onClick={spin}
                            disabled={isSpinning || bets.length === 0}
                            className="w-full h-12 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSpinning ? "Spinning..." : "Spin"}
                        </Button>

                        <Button
                            onClick={clearBets}
                            disabled={isSpinning || bets.length === 0}
                            className="w-full h-10 bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold"
                        >
                            Clear Bets
                        </Button>

                    </div>

                    {/* RIGHT: Game Area */}
                    <div className="flex-1 bg-[#0f212e] relative flex flex-col min-h-[500px]">

                        {/* Roulette Wheel */}
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="relative">
                                {/* Wheel */}
                                <div className={cn(
                                    "w-64 h-64 rounded-full border-8 border-[#F7D979] flex items-center justify-center relative",
                                    isSpinning && "animate-spin"
                                )} style={{ animationDuration: isSpinning ? '3s' : '0s' }}>
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8B4513] to-[#654321]" />
                                    <div className="relative z-10 text-center">
                                        {lastResult !== null && !isSpinning && (
                                            <div className="animate-in fade-in zoom-in duration-500">
                                                <div className={cn(
                                                    "text-6xl font-black mb-2",
                                                    getNumberColor(lastResult) === 'red' && "text-red-500",
                                                    getNumberColor(lastResult) === 'black' && "text-white",
                                                    getNumberColor(lastResult) === 'green' && "text-yellow-500"
                                                )}>
                                                    {lastResult}
                                                </div>
                                                <div className={cn(
                                                    "text-sm font-bold uppercase",
                                                    getNumberColor(lastResult) === 'red' && "text-red-500",
                                                    getNumberColor(lastResult) === 'black' && "text-white",
                                                    getNumberColor(lastResult) === 'green' && "text-yellow-500"
                                                )}>
                                                    {getNumberColor(lastResult)}
                                                </div>
                                            </div>
                                        )}
                                        {lastResult === null && (
                                            <Circle className="w-16 h-16 text-[#b1bad3]" />
                                        )}
                                    </div>
                                </div>
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
                                <Circle className="w-4 h-4 text-red-500" /> Roulette
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
