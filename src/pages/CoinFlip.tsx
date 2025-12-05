import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, Maximize2, BarChart2, Volume2, VolumeX, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';
import { Bet } from '@/types';
import RecentBets from '@/components/home/LiveBets';
import { useGameSounds } from '@/hooks/useGameSounds';

export default function CoinFlip() {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const { openFairnessModal } = useUI();
  const controls = useAnimation();
  const { playSound, soundEnabled, toggleSound } = useGameSounds();

  // Game State
  const [betAmount, setBetAmount] = useState<number>(0);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [history, setHistory] = useState<Bet[]>([]);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');

  // Autobet State
  const [numberOfBets, setNumberOfBets] = useState<number>(10);
  const [isAutobetting, setIsAutobetting] = useState<boolean>(false);
  const [autobetStats, setAutobetStats] = useState({ betsPlaced: 0, profit: 0 });
  const autobetRef = useRef<boolean>(false);

  // Animation State
  const [coinRotation, setCoinRotation] = useState(0);

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
      .eq('game_type', 'CoinFlip')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setHistory(data as unknown as Bet[]);
  };

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBetAmount(isNaN(val) ? 0 : val);
  };

  const adjustBet = (factor: number) => {
    setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
  };

  const handleFlip = async () => {
    if (!user) return toast.error("Please log in to play");
    if (betAmount <= 0) return toast.error("Invalid bet amount");
    if (betAmount > balance) return toast.error("Insufficient balance");
    if (isFlipping) return;

    setIsFlipping(true);
    optimisticUpdate(-betAmount);

    // Determine Outcome
    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    const isWin = outcome === selectedSide;
    const multiplier = 1.98; // ~1% House Edge
    const payout = isWin ? betAmount * multiplier : 0;

    // Animation Logic
    const spins = 5;
    const baseRotation = outcome === 'heads' ? 0 : 180;
    const targetRotation = coinRotation + (spins * 360) + (baseRotation - (coinRotation % 360));

    const finalRotation = targetRotation < coinRotation + 720 ? targetRotation + 720 : targetRotation;

    await controls.start({
      rotateY: finalRotation,
      transition: { duration: 2, ease: [0.2, 0.8, 0.2, 1] }
    });

    setCoinRotation(finalRotation);

    // Result Handling
    if (isWin) {
      playSound('win');
      optimisticUpdate(payout);
    } else {
      playSound('lose');
    }

    // DB Sync
    try {
      const netChange = isWin ? (payout - betAmount) : -betAmount;
      await supabase.rpc('increment_balance', { p_user_id: user.id, p_amount: netChange });

      const { data: bet } = await supabase.from('bets').insert({
        user_id: user.id,
        game_type: 'CoinFlip',
        stake_credits: betAmount,
        payout_credits: payout,
        result: isWin ? 'win' : 'loss',
        raw_data: { side: selectedSide, outcome }
      }).select().single();

      if (bet) setHistory(prev => [bet as unknown as Bet, ...prev].slice(0, 20));
    } catch (e) {
      console.error(e);
    } finally {
      setIsFlipping(false);
    }

    return { isWin, profit: isWin ? payout - betAmount : -betAmount };
  };

  const handleRandomPick = () => {
    setSelectedSide(Math.random() > 0.5 ? 'heads' : 'tails');
  };

  // Autobet Functions
  const startAutobet = async () => {
    if (!user) return toast.error("Please log in to play");
    if (betAmount <= 0) return toast.error("Invalid bet amount");
    if (betAmount > balance) return toast.error("Insufficient balance");
    if (isAutobetting) return;

    autobetRef.current = true;
    setIsAutobetting(true);
    setAutobetStats({ betsPlaced: 0, profit: 0 });

    let betsRemaining = numberOfBets;
    let totalProfit = 0;

    while (autobetRef.current && betsRemaining > 0 && betAmount <= balance) {
      const result = await handleFlip();
      if (result) {
        totalProfit += result.profit;
        setAutobetStats(prev => ({
          betsPlaced: prev.betsPlaced + 1,
          profit: totalProfit
        }));
        betsRemaining--;
      }
      // Small delay between bets
      await new Promise(r => setTimeout(r, 500));
    }

    autobetRef.current = false;
    setIsAutobetting(false);
  };

  const stopAutobet = () => {
    autobetRef.current = false;
    setIsAutobetting(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Main Game Container */}
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

            {/* Manual Mode Controls */}
            {mode === 'manual' && (
              <>
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
                      onChange={handleBetInputChange}
                      disabled={isFlipping}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553] disabled:opacity-50"
                    />
                    <div className="absolute right-1 flex gap-1">
                      <button
                        onClick={() => adjustBet(0.5)}
                        disabled={isFlipping}
                        className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                      >
                        ½
                      </button>
                      <button
                        onClick={() => adjustBet(2)}
                        disabled={isFlipping}
                        className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50"
                      >
                        2×
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bet Button */}
                <Button
                  onClick={handleFlip}
                  disabled={isFlipping}
                  className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFlipping ? "Flipping..." : "Bet"}
                </Button>

                {/* Random Pick */}
                <Button
                  onClick={handleRandomPick}
                  disabled={isFlipping}
                  className="w-full h-10 bg-[#2f4553] hover:bg-[#3d5565] text-white font-bold border border-transparent hover:border-[#b1bad3]/20"
                >
                  Random Pick
                </Button>
              </>
            )}

            {/* Auto Mode Controls */}
            {mode === 'auto' && (
              <>
                {/* Bet Amount */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                    <span>Bet Amount</span>
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={handleBetInputChange}
                      disabled={isAutobetting}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10"
                    />
                    <div className="absolute right-1 flex gap-1">
                      <button onClick={() => adjustBet(0.5)} disabled={isAutobetting} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">½</button>
                      <button onClick={() => adjustBet(2)} disabled={isAutobetting} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">2×</button>
                    </div>
                  </div>
                </div>

                {/* Number of Bets */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                    <span>Number of Bets</span>
                  </div>
                  <Input
                    type="number"
                    value={numberOfBets}
                    onChange={(e) => setNumberOfBets(parseInt(e.target.value) || 10)}
                    disabled={isAutobetting}
                    className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10"
                  />
                </div>

                {/* Autobet Stats */}
                {isAutobetting && (
                  <div className="bg-[#0f212e] rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#b1bad3]">Bets Placed</span>
                      <span className="text-white font-bold">{autobetStats.betsPlaced}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#b1bad3]">Profit</span>
                      <span className={cn("font-bold", autobetStats.profit >= 0 ? "text-[#00e701]" : "text-[#ed4245]")}>
                        {autobetStats.profit >= 0 ? '+' : ''}{autobetStats.profit.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Start/Stop Button */}
                <Button
                  onClick={isAutobetting ? stopAutobet : startAutobet}
                  className={cn(
                    "w-full h-12 mt-2 font-black text-base shadow-[0_4px_0] active:shadow-none active:translate-y-[4px] transition-all",
                    isAutobetting
                      ? "bg-[#ed4245] hover:bg-[#c73c3e] text-white shadow-[#9a2f31]"
                      : "bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] shadow-[#B8860B]"
                  )}
                >
                  {isAutobetting ? "Stop Autobet" : "Start Autobet"}
                </Button>
              </>
            )}

            {/* Side Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedSide('heads')}
                disabled={isFlipping}
                className={cn(
                  "flex-1 h-12 rounded flex items-center justify-center gap-2 font-bold transition-all border border-transparent",
                  selectedSide === 'heads'
                    ? "bg-[#2f4553] border-[#b1bad3]/20 text-white shadow-inner"
                    : "bg-[#0f212e] text-[#b1bad3] hover:bg-[#1a2c38]"
                )}
              >
                <span>Heads</span>
                <div className="w-3 h-3 rounded-full bg-[#FFD700]" />
              </button>
              <button
                onClick={() => setSelectedSide('tails')}
                disabled={isFlipping}
                className={cn(
                  "flex-1 h-12 rounded flex items-center justify-center gap-2 font-bold transition-all border border-transparent",
                  selectedSide === 'tails'
                    ? "bg-[#2f4553] border-[#b1bad3]/20 text-white shadow-inner"
                    : "bg-[#0f212e] text-[#b1bad3] hover:bg-[#1a2c38]"
                )}
              >
                <span>Tails</span>
                <div className="w-3 h-3 rotate-45 bg-[#1475e1]" />
              </button>
            </div>

            {/* Total Profit */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                <span>Total Profit (1.98x)</span>
                <span>0.00000000 LTC</span>
              </div>
              <div className="relative flex items-center">
                <Input
                  readOnly
                  value={isFlipping ? "..." : (betAmount * 0.98).toFixed(8)}
                  className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-8 h-10"
                />
                <div className="absolute right-3 text-[#00e701] font-bold">$</div>
              </div>
            </div>

          </div>

          {/* RIGHT: Game Area */}
          <div className="flex-1 bg-[#0f212e] flex flex-col relative min-h-[500px]">

            {/* Coin Animation Stage */}
            <div className="flex-1 flex items-center justify-center perspective-[1000px]">
              <motion.div
                className="relative w-64 h-64"
                animate={controls}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Heads Side */}
                <div className="absolute inset-0 rounded-full backface-hidden"
                  style={{
                    background: 'radial-gradient(circle at 30% 30%, #FFD700, #DAA520)',
                    boxShadow: 'inset 0 0 20px #B8860B, 0 0 15px rgba(0,0,0,0.5)',
                    border: '8px solid #DAA520'
                  }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-4 border-[#B8860B]/30 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-[#F7D979] flex items-center justify-center shadow-inner">
                        <span className="text-6xl font-black text-[#B8860B] drop-shadow-md">H</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tails Side */}
                <div className="absolute inset-0 rounded-full backface-hidden"
                  style={{
                    transform: 'rotateY(180deg)',
                    background: 'radial-gradient(circle at 30% 30%, #4a90e2, #0056b3)',
                    boxShadow: 'inset 0 0 20px #003d80, 0 0 15px rgba(0,0,0,0.5)',
                    border: '8px solid #0056b3'
                  }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-4 border-[#003d80]/30 flex items-center justify-center">
                      <div className="w-32 h-32 rotate-45 bg-[#1475e1] flex items-center justify-center shadow-inner">
                        <span className="text-6xl font-black text-[#003d80] drop-shadow-md -rotate-45">T</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edge/Thickness (Simulated) */}
                <div className="absolute inset-0 rounded-full" style={{ transform: 'translateZ(-5px)', background: '#8B6914' }} />
              </motion.div>
            </div>

            {/* History Bar */}
            <div className="absolute bottom-16 left-4 right-4 bg-[#1a2c38] rounded-lg p-3 border border-[#213743]">
              <div className="text-xs font-bold text-[#b1bad3] mb-2">History</div>
              <div className="flex gap-2 overflow-hidden">
                {history.length === 0 ? (
                  <div className="w-full h-8 flex items-center justify-center text-xs text-[#b1bad3]/50">No recent bets</div>
                ) : (
                  history.map((bet, i) => {
                    const side = bet.raw_data?.outcome || 'heads';
                    return (
                      <div
                        key={bet.id}
                        className={cn(
                          "w-6 h-8 rounded shrink-0 flex items-center justify-center shadow-sm border border-white/5",
                          side === 'heads' ? "bg-[#FFD700] text-black" : "bg-[#1475e1] text-white"
                        )}
                      >
                        <div className={cn("w-3 h-3 rounded-full", side === 'heads' ? "bg-white/50" : "rotate-45 bg-white/50")} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Controls */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <BarChart2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg">
                Shiny
              </div>

              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 bg-[#213743] px-3 py-1 rounded-full hover:bg-[#2f4553] cursor-pointer transition-colors"
                  onClick={openFairnessModal}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Fairness</span>
                </div>
              </div>
            </div>

          </div> {/* Closes RIGHT: Game Area */}

        </div> {/* Closes the main flex container for LEFT and RIGHT sections */}

        {/* Live Bets */}
        <RecentBets />

      </div> {/* Closes the outer-most div of the component */}
    </div>
  );
}
