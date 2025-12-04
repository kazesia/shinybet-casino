import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import { Bet } from '@/types';

type Card = {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    value: string;
    score: number;
};

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const BlackjackGame = () => {
    const { user } = useAuth();
    const { balance, optimisticUpdate } = useWallet();
    const sound = useSound();

    // Game State
    const [betAmount, setBetAmount] = useState<number>(0);
    const [gameState, setGameState] = useState<'betting' | 'playing' | 'dealerTurn' | 'gameOver'>('betting');
    const [playerHand, setPlayerHand] = useState<Card[]>([]);
    const [dealerHand, setDealerHand] = useState<Card[]>([]);
    const [deck, setDeck] = useState<Card[]>([]);
    const [history, setHistory] = useState<Bet[]>([]);
    const [outcome, setOutcome] = useState<'win' | 'loss' | 'push' | null>(null);

    useEffect(() => {
        if (user) {
            fetchHistory();
        }
    }, [user]);

    const fetchHistory = async () => {
        const { data } = await supabase
            .from('bets')
            .select('*')
            .eq('user_id', user?.id)
            .eq('game_type', 'Blackjack')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setHistory(data as unknown as Bet[]);
    };

    const createDeck = () => {
        const newDeck: Card[] = [];
        for (const suit of SUITS) {
            for (const value of VALUES) {
                let score = parseInt(value);
                if (['J', 'Q', 'K'].includes(value)) score = 10;
                if (value === 'A') score = 11;
                newDeck.push({ suit, value, score });
            }
        }
        return newDeck.sort(() => Math.random() - 0.5);
    };

    const calculateScore = (hand: Card[]) => {
        let score = hand.reduce((acc, card) => acc + card.score, 0);
        let aces = hand.filter(card => card.value === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces -= 1;
        }
        return score;
    };

    const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setBetAmount(isNaN(val) ? 0 : val);
    };

    const adjustBet = (factor: number) => {
        setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
    };

    const deal = async () => {
        if (!user) return toast.error("Please log in to play");
        if (betAmount <= 0) return toast.error("Invalid bet amount");
        if (betAmount > balance) return toast.error("Insufficient balance");

        sound.bet();
        const newDeck = createDeck();

        // Deal cards with animation delay
        const pHand: Card[] = [];
        const dHand: Card[] = [];

        // Deal first card to player
        await new Promise(resolve => setTimeout(resolve, 200));
        pHand.push(newDeck.pop()!);
        setPlayerHand([...pHand]);
        sound.click();

        // Deal first card to dealer
        await new Promise(resolve => setTimeout(resolve, 400));
        dHand.push(newDeck.pop()!);
        setDealerHand([...dHand]);
        sound.click();

        // Deal second card to player
        await new Promise(resolve => setTimeout(resolve, 400));
        pHand.push(newDeck.pop()!);
        setPlayerHand([...pHand]);
        sound.click();

        // Deal second card to dealer (face down)
        await new Promise(resolve => setTimeout(resolve, 400));
        dHand.push(newDeck.pop()!);
        setDealerHand([...dHand]);
        sound.click();

        setDeck(newDeck);
        setGameState('playing');
        setOutcome(null);
        optimisticUpdate(-betAmount);

        // Check for natural blackjack
        if (calculateScore(pHand) === 21) {
            handleGameOver(pHand, dHand, 'win', 2.5); // 3:2 payout usually, but let's say 2.5x total return (1.5x profit)
        }
    };

    const hit = async () => {
        sound.click();
        await new Promise(resolve => setTimeout(resolve, 200));

        const newDeck = [...deck];
        const card = newDeck.pop()!;
        const newHand = [...playerHand, card];

        setDeck(newDeck);
        setPlayerHand(newHand);

        if (calculateScore(newHand) > 21) {
            sound.loss();
            handleGameOver(newHand, dealerHand, 'loss', 0);
        }
    };

    const stand = async () => {
        setGameState('dealerTurn');
        let currentDealerHand = [...dealerHand];
        let currentDeck = [...deck];

        // Dealer hits until 17
        while (calculateScore(currentDealerHand) < 17) {
            await new Promise(resolve => setTimeout(resolve, 800)); // Delay for effect
            sound.click();
            const card = currentDeck.pop()!;
            currentDealerHand = [...currentDealerHand, card];
            setDealerHand(currentDealerHand);
            setDeck(currentDeck);
        }

        const pScore = calculateScore(playerHand);
        const dScore = calculateScore(currentDealerHand);

        let result: 'win' | 'loss' | 'push' = 'loss';
        let payoutMult = 0;

        if (dScore > 21 || pScore > dScore) {
            result = 'win';
            payoutMult = 2;
            sound.win();
        } else if (pScore === dScore) {
            result = 'push';
            payoutMult = 1;
        } else {
            sound.loss();
        }

        handleGameOver(playerHand, currentDealerHand, result, payoutMult);
    };

    const handleGameOver = async (pHand: Card[], dHand: Card[], result: 'win' | 'loss' | 'push', payoutMult: number) => {
        setGameState('gameOver');
        setOutcome(result);

        const payout = betAmount * payoutMult;
        if (payout > 0) {
            optimisticUpdate(payout);
        }

        // Sync to DB
        if (!user) return;

        try {
            const netChange = payout - betAmount;

            // Update Wallet
            const { error: walletError } = await supabase.rpc('increment_balance', { p_user_id: user.id, p_amount: netChange });
            if (walletError) console.error("Wallet error:", walletError);

            // Insert Bet
            const { data: bet, error: betError } = await supabase.from('bets').insert({
                user_id: user.id,
                game_type: 'Blackjack',
                stake_credits: betAmount,
                payout_credits: payout,
                result: result === 'push' ? 'win' : result,
            }).select().single();

            if (betError) {
                console.error("Bet error:", betError);
                toast.error(`Failed to save bet: ${betError.message}`);
            }
            if (bet) setHistory(prev => [bet as unknown as Bet, ...prev].slice(0, 10));

        } catch (e) {
            console.error("DB Sync error:", e);
        }
    };

    const renderCard = (card: Card, hidden = false, index = 0, handOutcome: 'win' | 'loss' | 'push' | null = null) => {
        if (hidden) {
            return (
                <motion.div
                    initial={{ scale: 0, rotateY: 180 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="w-20 h-28 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-white/20 flex items-center justify-center shadow-xl"
                >
                    <div className="w-16 h-24 bg-blue-900 rounded border border-white/10 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-30">S</span>
                    </div>
                </motion.div>
            );
        }
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

        // Determine border color based on outcome
        // Determine border color based on outcome
        let borderColor = 'border-gray-200';
        if (handOutcome === 'win') {
            borderColor = 'border-[#00e701] shadow-[0_0_10px_#00e701]'; // Neon Green + Glow
        } else if (handOutcome === 'loss') {
            borderColor = 'border-[#ff4d4d] shadow-[0_0_10px_#ff4d4d]'; // Red + Glow
        } else if (handOutcome === 'push') {
            borderColor = 'border-[#FFD700] shadow-[0_0_10px_#FFD700]'; // Gold + Glow
        }

        return (
            <motion.div
                initial={{ scale: 0, rotateY: 180, y: -50 }}
                animate={{ scale: 1, rotateY: 0, y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: index * 0.1
                }}
                className={cn(
                    "w-20 h-28 bg-white rounded-lg flex flex-col items-center justify-between p-2 shadow-xl relative select-none border-4",
                    borderColor
                )}
            >
                <div className="flex flex-col items-center">
                    <span className={cn("text-2xl font-bold leading-none", isRed ? "text-red-600" : "text-black")}>
                        {card.value}
                    </span>
                    <span className={cn("text-xl leading-none", isRed ? "text-red-600" : "text-black")}>
                        {card.suit === 'hearts' && '♥'}
                        {card.suit === 'diamonds' && '♦'}
                        {card.suit === 'clubs' && '♣'}
                        {card.suit === 'spades' && '♠'}
                    </span>
                </div>
                <span className={cn("text-4xl", isRed ? "text-red-600" : "text-black")}>
                    {card.suit === 'hearts' && '♥'}
                    {card.suit === 'diamonds' && '♦'}
                    {card.suit === 'clubs' && '♣'}
                    {card.suit === 'spades' && '♠'}
                </span>
                <div className="flex flex-col items-center rotate-180">
                    <span className={cn("text-2xl font-bold leading-none", isRed ? "text-red-600" : "text-black")}>
                        {card.value}
                    </span>
                    <span className={cn("text-xl leading-none", isRed ? "text-red-600" : "text-black")}>
                        {card.suit === 'hearts' && '♥'}
                        {card.suit === 'diamonds' && '♦'}
                        {card.suit === 'clubs' && '♣'}
                        {card.suit === 'spades' && '♠'}
                    </span>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
            <div className="max-w-[1200px] mx-auto space-y-6">

                <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">

                    {/* Controls */}
                    <div className="w-full lg:w-[320px] bg-[#213743] p-4 flex flex-col gap-4 border-r border-[#1a2c38]">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                                <span>Bet Amount</span>
                                <span>{betAmount.toFixed(8)} LTC</span>
                            </div>
                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-[#b1bad3] pointer-events-none select-none">$</div>
                                <Input
                                    type="number"
                                    value={betAmount}
                                    onChange={handleBetAmountChange}
                                    disabled={gameState === 'playing' || gameState === 'dealerTurn'}
                                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-6 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553]"
                                />
                                <div className="absolute right-1 flex gap-1">
                                    <button onClick={() => adjustBet(0.5)} disabled={gameState !== 'betting' && gameState !== 'gameOver'} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors">½</button>
                                    <button onClick={() => adjustBet(2)} disabled={gameState !== 'betting' && gameState !== 'gameOver'} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors">2×</button>
                                </div>
                            </div>
                        </div>

                        {gameState === 'betting' || gameState === 'gameOver' ? (
                            <Button
                                onClick={deal}
                                className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all"
                            >
                                Deal
                            </Button>
                        ) : (
                            <div className="flex gap-2 mt-2">
                                <Button
                                    onClick={hit}
                                    disabled={gameState !== 'playing'}
                                    className="flex-1 h-12 bg-[#1475e1] hover:bg-[#1465d1] text-white font-bold shadow-[0_4px_0_#0f5bb5] active:shadow-none active:translate-y-[4px] transition-all"
                                >
                                    Hit
                                </Button>
                                <Button
                                    onClick={stand}
                                    disabled={gameState !== 'playing'}
                                    className="flex-1 h-12 bg-[#F7D979] hover:bg-[#e7c969] text-black font-bold shadow-[0_4px_0_#d7b959] active:shadow-none active:translate-y-[4px] transition-all"
                                >
                                    Stand
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Game Area */}
                    <div className="flex-1 bg-[#0f212e] p-6 md:p-12 flex flex-col relative min-h-[500px]">

                        {/* Dealer Hand */}
                        <div className="flex flex-col items-center mb-12">
                            <div className="text-sm font-bold text-[#b1bad3] mb-2">Dealer</div>
                            <div className="flex gap-2">
                                {dealerHand.map((card, i) => (
                                    <div key={i}>
                                        {renderCard(
                                            card,
                                            gameState === 'playing' && i === 1,
                                            i,
                                            gameState === 'gameOver' ? (outcome === 'win' ? 'loss' : outcome === 'loss' ? 'win' : 'push') : null
                                        )}
                                    </div>
                                ))}
                                {dealerHand.length === 0 && <div className="h-28 w-20 border-2 border-dashed border-[#2f4553] rounded-lg" />}
                            </div>
                            {gameState !== 'betting' && gameState !== 'playing' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="mt-2 px-3 py-1 rounded-full bg-[#213743] border border-[#2f4553]"
                                >
                                    <div className="text-xl font-bold text-white">{calculateScore(dealerHand)}</div>
                                </motion.div>
                            )}
                        </div>

                        {/* Center Info */}
                        <div className="flex-1 flex items-center justify-center">
                            {outcome && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="bg-[#213743] px-8 py-4 rounded-xl border-2 border-[#2f4553] shadow-2xl"
                                >
                                    <h2 className={cn("text-4xl font-black uppercase",
                                        outcome === 'win' ? "text-[#FFD700]" :
                                            outcome === 'loss' ? "text-red-500" : "text-[#F7D979]"
                                    )}>
                                        {outcome === 'win' ? 'You Won!' : outcome === 'loss' ? 'Dealer Wins' : 'Push'}
                                    </h2>
                                </motion.div>
                            )}
                        </div>

                        {/* Player Hand */}
                        <div className="flex flex-col items-center mt-12">
                            <div className="text-sm font-bold text-[#b1bad3] mb-2">You</div>
                            <div className="flex gap-2">
                                {playerHand.map((card, i) => (
                                    <div key={i}>
                                        {renderCard(card, false, i, gameState === 'gameOver' ? outcome : null)}
                                    </div>
                                ))}
                                {playerHand.length === 0 && <div className="h-28 w-20 border-2 border-dashed border-[#2f4553] rounded-lg" />}
                            </div>
                            {gameState !== 'betting' && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="mt-2 px-3 py-1 rounded-full bg-[#213743] border border-[#2f4553]"
                                >
                                    <div className="text-xl font-bold text-white">{calculateScore(playerHand)}</div>
                                </motion.div>
                            )}
                        </div>

                    </div>
                </div>

                {/* History Table (Same as Dice) */}
                <div className="bg-[#1a2c38] rounded-lg border border-[#213743] overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-[#213743]">
                        <h3 className="text-white font-bold">Recent Bets</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-[#b1bad3] bg-[#0f212e] uppercase">
                                <tr>
                                    <th className="px-6 py-3">Game</th>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3 text-right">Bet Amount</th>
                                    <th className="px-6 py-3 text-right">Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((bet) => (
                                    <tr key={bet.id} className="bg-[#1a2c38] border-b border-[#213743] hover:bg-[#213743]">
                                        <td className="px-6 py-4 font-medium text-white">Blackjack</td>
                                        <td className="px-6 py-4 text-[#b1bad3]">{user?.email?.split('@')[0] || 'Hidden'}</td>
                                        <td className="px-6 py-4 text-[#b1bad3]">{new Date(bet.created_at).toLocaleTimeString()}</td>
                                        <td className="px-6 py-4 text-right text-white font-mono">{bet.stake_credits.toFixed(8)}</td>
                                        <td className={cn("px-6 py-4 text-right font-bold", bet.result === 'win' ? "text-[#FFD700]" : "text-[#b1bad3]")}>
                                            {bet.payout_credits > 0 ? `+${bet.payout_credits.toFixed(8)}` : '0.00000000'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BlackjackGame;
