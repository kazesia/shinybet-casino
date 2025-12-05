import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, BarChart2, RefreshCw, Volume2, VolumeX, Infinity as InfinityIcon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';
import { Bet } from '@/types';
import { BetInput } from '@/components/game/BetInput';
import { useViewport } from '@/hooks/useViewport';
import { GameControlsMobile } from '@/components/game/GameControlsMobile';
import RecentBets from '@/components/home/LiveBets';
import { useDiceRoll } from '@/hooks/useDiceRoll';
import { ProvablyFairModal } from '@/components/game/ProvablyFairModal';
import { DiceFeed } from '@/components/game/DiceFeed';
import { DEFAULT_HOUSE_EDGE, truncateHash } from '@/lib/provablyFair';

const DiceGame = () => {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const { openFairnessModal } = useUI();
  const { isMobile } = useViewport();

  // Provably Fair Hook
  const {
    seeds,
    betHistory,
    isLoading: seedsLoading,
    rotateSeed,
    updateClientSeed,
  } = useDiceRoll();

  // Fairness Modal State
  const [fairnessModalOpen, setFairnessModalOpen] = useState(false);

  // Game State
  const [betAmount, setBetAmount] = useState<number | string>(0);
  const [winChance, setWinChance] = useState<number>(49.5);
  const [rollOver, setRollOver] = useState<number>(50.5);
  const [multiplier, setMultiplier] = useState<number>(2.0000);
  const [rollCondition, setRollCondition] = useState<'over' | 'under'>('over');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [history, setHistory] = useState<Bet[]>([]);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Autobet State
  const [numberOfBets, setNumberOfBets] = useState<number | 'infinity'>(0);
  const [onWinAction, setOnWinAction] = useState<'reset' | 'increase'>('reset');
  const [onWinIncrease, setOnWinIncrease] = useState<number>(0);
  const [onLossAction, setOnLossAction] = useState<'reset' | 'increase'>('reset');
  const [onLossIncrease, setOnLossIncrease] = useState<number>(0);
  const [stopOnProfit, setStopOnProfit] = useState<number>(0);
  const [stopOnLoss, setStopOnLoss] = useState<number>(0);
  const [isAutobetting, setIsAutobetting] = useState<boolean>(false);
  const [autobetStats, setAutobetStats] = useState({ betsPlaced: 0, profit: 0 });
  const autobetRef = useRef<boolean>(false);
  const baseBetRef = useRef<number>(0);

  // Audio Refs - preload for instant playback
  const winSound = useRef(new Audio('/sounds/win.mp3'));
  const loseSound = useRef(new Audio('/sounds/lose.mp3'));
  const clickSound = useRef(new Audio('/sounds/click.mp3'));
  const sliderSound = useRef(new Audio('/sounds/slider.mp3'));
  const rollSound = useRef(new Audio('/sounds/slider.mp3'));

  // Preload audio on mount for instant playback
  useEffect(() => {
    // Preload all sounds
    rollSound.current.load();
    winSound.current.load();
    loseSound.current.load();
    sliderSound.current.load();
  }, []);

  // Calculate Profit
  const numericBetAmount = typeof betAmount === 'string' ? parseFloat(betAmount) || 0 : betAmount;
  const profitOnWin = numericBetAmount * multiplier - numericBetAmount;

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
      .eq('game_type', 'Dice')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setHistory(data as unknown as Bet[]);
  };

  const playSound = (type: 'win' | 'lose' | 'click' | 'slider' | 'roll') => {
    if (!soundEnabled) return;
    try {
      if (type === 'win') {
        winSound.current.currentTime = 0;
        winSound.current.volume = 0.7;
        winSound.current.play();
      } else if (type === 'lose') {
        loseSound.current.currentTime = 0;
        loseSound.current.volume = 0.7;
        loseSound.current.play();
      } else if (type === 'click') {
        clickSound.current.currentTime = 0;
        clickSound.current.volume = 0.5;
        clickSound.current.play();
      } else if (type === 'slider') {
        sliderSound.current.currentTime = 0;
        sliderSound.current.volume = 0.6;
        sliderSound.current.play();
      } else if (type === 'roll') {
        // Play dice shake in loop during roll
        rollSound.current.currentTime = 0;
        rollSound.current.volume = 0.8;
        rollSound.current.loop = true;
        rollSound.current.play();
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  const stopRollSound = () => {
    try {
      rollSound.current.loop = false;
      rollSound.current.pause();
      rollSound.current.currentTime = 0;
    } catch (e) {
      console.error("Audio stop failed", e);
    }
  };

  // --- Math Logic for Inputs ---

  const updateFromMultiplier = (val: number) => {
    const safeMult = Math.max(1.0102, Math.min(9900, val));
    setMultiplier(safeMult);
    const newWinChance = 99 / safeMult;
    setWinChance(parseFloat(newWinChance.toFixed(4)));
    setRollOver(parseFloat((100 - newWinChance).toFixed(2)));
  };

  const updateFromWinChance = (val: number) => {
    const safeChance = Math.max(0.01, Math.min(98, val));
    setWinChance(safeChance);
    setMultiplier(parseFloat((99 / safeChance).toFixed(4)));
    setRollOver(parseFloat((100 - safeChance).toFixed(2)));
  };

  const updateFromRollOver = (val: number) => {
    const safeRoll = Math.max(2, Math.min(99.99, val));
    setRollOver(safeRoll);
    const newWinChance = 100 - safeRoll;
    setWinChance(parseFloat(newWinChance.toFixed(4)));
    setMultiplier(parseFloat((99 / newWinChance).toFixed(4)));
  };

  // --- Handlers ---

  const handleBetAmountChange = (val: number | string) => {
    setBetAmount(val);
  };

  const adjustBet = (factor: number) => {
    setBetAmount(prev => {
      const val = typeof prev === 'string' ? parseFloat(prev) : prev;
      if (isNaN(val)) return 0;
      return parseFloat((val * factor).toFixed(8));
    });
  };

  const handleRoll = async () => {
    if (!user) return toast.error("Please log in to play");
    if (numericBetAmount <= 0) return toast.error("Invalid bet amount");
    if (numericBetAmount > balance) return toast.error("Insufficient balance");
    if (isRolling) return;

    playSound('roll'); // Play dice shake sound during roll
    setIsRolling(true);
    optimisticUpdate(-numericBetAmount);

    try {
      // Call Secure RPC
      const { data, error } = await supabase.rpc('place_bet', {
        p_game_type: 'Dice',
        p_bet_amount: numericBetAmount,
        p_client_seed: user.id, // TODO: Implement proper client seed
        p_game_params: {
          target: rollOver,
          condition: rollCondition
        }
      });

      if (error) throw error;

      // Parse Result
      const result = data.roll;
      const isWin = data.won;
      const payout = data.payout;
      const riskFlags = data.risk_flags;

      // Update UI
      setLastResult(result);

      // Stop roll sound and play result sound
      stopRollSound();

      if (isWin) {
        optimisticUpdate(payout);
        playSound('win');
        // Toast removed as per request
      } else {
        playSound('lose');
      }

      // Handle Responsible Gaming Flags
      if (riskFlags?.flagged_for_win_review) {
        // Silent flag, or maybe notify user?
        // toast.info("Big Win! Your account is under review for a bonus.");
      }

      // Refresh History
      fetchHistory();

    } catch (e: any) {
      console.error(e);
      // Revert optimistic update on error
      optimisticUpdate(numericBetAmount);

      // Handle specific errors
      if (e.message?.includes('Daily loss limit reached')) {
        // toast.error("Daily Loss Limit Reached", {
        //   description: "You have hit your daily loss limit. Please come back tomorrow.",
        //   duration: 8000,
        // });
      } else {
        toast.error(e.message || "Failed to place bet");
      }
    } finally {
      stopRollSound(); // Make sure sound stops even on error
      setIsRolling(false);
    }
  };

  // syncToDb is no longer needed as RPC handles it
  // const syncToDb = ... (removed)

  // Autobet Functions
  const startAutobet = async () => {
    if (!user) return toast.error("Please log in to play");
    if (numericBetAmount <= 0) return toast.error("Invalid bet amount");
    if (numericBetAmount > balance) return toast.error("Insufficient balance");

    autobetRef.current = true;
    baseBetRef.current = numericBetAmount;
    setIsAutobetting(true);
    setAutobetStats({ betsPlaced: 0, profit: 0 });

    let currentBet = numericBetAmount;
    let betsPlaced = 0;
    let totalProfit = 0;
    const maxBets: number = numberOfBets === 'infinity' ? Infinity : (typeof numberOfBets === 'number' ? numberOfBets : 0);

    while (autobetRef.current && betsPlaced < maxBets) {
      if (currentBet > balance) {
        toast.error("Insufficient balance");
        break;
      }

      try {
        optimisticUpdate(-currentBet);

        const { data, error } = await supabase.rpc('place_bet', {
          p_game_type: 'Dice',
          p_bet_amount: currentBet,
          p_client_seed: user.id,
          p_game_params: { target: rollOver, condition: 'over' }
        });

        if (error) throw error;

        const result = data.roll;
        const isWin = data.won;
        const payout = data.payout;

        setLastResult(result);

        if (isWin) {
          optimisticUpdate(payout);
          totalProfit += (payout - currentBet);
          playSound('win');

          // On Win Action
          if (onWinAction === 'reset') {
            currentBet = baseBetRef.current;
          } else {
            currentBet = currentBet * (1 + onWinIncrease / 100);
          }
        } else {
          totalProfit -= currentBet;
          playSound('lose');

          // On Loss Action
          if (onLossAction === 'reset') {
            currentBet = baseBetRef.current;
          } else {
            currentBet = currentBet * (1 + onLossIncrease / 100);
          }
        }

        betsPlaced++;
        setAutobetStats({ betsPlaced, profit: totalProfit });
        setBetAmount(parseFloat(currentBet.toFixed(8)));

        // Check stop conditions
        if (stopOnProfit > 0 && totalProfit >= stopOnProfit) {
          toast.success(`Profit target reached: +${totalProfit.toFixed(4)}`);
          break;
        }
        if (stopOnLoss > 0 && totalProfit <= -stopOnLoss) {
          toast.error(`Loss limit reached: ${totalProfit.toFixed(4)}`);
          break;
        }

        // Small delay between bets
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (e: any) {
        console.error(e);
        optimisticUpdate(currentBet);
        toast.error(e.message || "Bet failed");
        break;
      }
    }

    autobetRef.current = false;
    setIsAutobetting(false);
    fetchHistory();
  };

  const stopAutobet = () => {
    autobetRef.current = false;
    setIsAutobetting(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
      <div className="max-w-[1200px] mx-auto space-y-6">

        {/* Main Game Interface */}
        <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">

          {/* Left Control Panel (Desktop Only) */}
          {!isMobile && (
            <div className="w-full lg:w-[320px] bg-[#213743] p-4 flex flex-col gap-4 border-r border-[#1a2c38]">

              {/* Mode Tabs */}
              <div className="bg-[#0f212e] p-1 rounded-full flex relative">
                <button
                  onClick={() => setMode('manual')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-full transition-all z-10",
                    mode === 'manual' ? "bg-[#2f4553] text-white shadow-md" : "text-[#b1bad3] hover:text-white"
                  )}
                >
                  Manual
                </button>
                <button
                  onClick={() => setMode('auto')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold rounded-full transition-all z-10",
                    mode === 'auto' ? "bg-[#2f4553] text-white shadow-md" : "text-[#b1bad3] hover:text-white"
                  )}
                >
                  Auto
                </button>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[#b1bad3]">
                  <Settings2 className="w-4 h-4" />
                </div>
              </div>

              {/* Manual Mode Controls */}
              {mode === 'manual' && (
                <>
                  {/* Bet Amount Input (Reusable Component) */}
                  <BetInput
                    value={betAmount}
                    onChange={handleBetAmountChange}
                    onHalf={() => adjustBet(0.5)}
                    onDouble={() => adjustBet(2)}
                    onMax={() => setBetAmount(balance)}
                  />

                  {/* Profit on Win (Read Only) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                      <span>Profit on Win</span>
                      <span>{profitOnWin.toFixed(2)} USD</span>
                    </div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-[#b1bad3] pointer-events-none select-none">$</div>
                      <Input
                        readOnly
                        value={profitOnWin.toFixed(2)}
                        className="bg-[#2f4553] border-transparent text-white font-bold pl-8 h-10 cursor-not-allowed opacity-80"
                      />
                    </div>
                  </div>

                  {/* Bet Button */}
                  <Button
                    type="button"
                    onClick={handleRoll}
                    disabled={isRolling}
                    className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all select-none"
                  >
                    <span className="select-none pointer-events-none">{isRolling ? "Rolling..." : "Bet"}</span>
                  </Button>
                </>
              )}

              {/* Auto Mode Controls */}
              {mode === 'auto' && (
                <>
                  {/* Bet Amount */}
                  <BetInput
                    value={betAmount}
                    onChange={handleBetAmountChange}
                    onHalf={() => adjustBet(0.5)}
                    onDouble={() => adjustBet(2)}
                    onMax={() => setBetAmount(balance)}
                    disabled={isAutobetting}
                  />

                  {/* Number of Bets */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#b1bad3]">Number of Bets</div>
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        value={numberOfBets === 'infinity' ? '' : numberOfBets}
                        onChange={(e) => setNumberOfBets(parseInt(e.target.value) || 0)}
                        disabled={isAutobetting}
                        className="bg-[#2f4553] border-transparent text-white font-bold h-10 pr-12"
                        placeholder="∞"
                      />
                      <button
                        onClick={() => setNumberOfBets(numberOfBets === 'infinity' ? 0 : 'infinity')}
                        disabled={isAutobetting}
                        className={cn(
                          "absolute right-2 w-8 h-8 flex items-center justify-center rounded transition-colors",
                          numberOfBets === 'infinity' ? "bg-[#00e701] text-black" : "bg-[#0f212e] text-[#b1bad3] hover:text-white"
                        )}
                      >
                        <InfinityIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* On Win */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#b1bad3]">On Win</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOnWinAction('reset')}
                        disabled={isAutobetting}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded transition-colors",
                          onWinAction === 'reset' ? "bg-[#2f4553] text-white" : "bg-[#0f212e] text-[#b1bad3] hover:text-white"
                        )}
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setOnWinAction('increase')}
                        disabled={isAutobetting}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded transition-colors",
                          onWinAction === 'increase' ? "bg-[#2f4553] text-white" : "bg-[#0f212e] text-[#b1bad3] hover:text-white"
                        )}
                      >
                        Increase
                      </button>
                    </div>
                    {onWinAction === 'increase' && (
                      <div className="relative">
                        <Input
                          type="number"
                          value={onWinIncrease}
                          onChange={(e) => setOnWinIncrease(parseFloat(e.target.value) || 0)}
                          disabled={isAutobetting}
                          className="bg-[#2f4553] border-transparent text-white font-bold h-10 pr-8"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-xs">%</span>
                      </div>
                    )}
                  </div>

                  {/* On Loss */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#b1bad3]">On Loss</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOnLossAction('reset')}
                        disabled={isAutobetting}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded transition-colors",
                          onLossAction === 'reset' ? "bg-[#2f4553] text-white" : "bg-[#0f212e] text-[#b1bad3] hover:text-white"
                        )}
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setOnLossAction('increase')}
                        disabled={isAutobetting}
                        className={cn(
                          "flex-1 py-2 text-xs font-bold rounded transition-colors",
                          onLossAction === 'increase' ? "bg-[#2f4553] text-white" : "bg-[#0f212e] text-[#b1bad3] hover:text-white"
                        )}
                      >
                        Increase
                      </button>
                    </div>
                    {onLossAction === 'increase' && (
                      <div className="relative">
                        <Input
                          type="number"
                          value={onLossIncrease}
                          onChange={(e) => setOnLossIncrease(parseFloat(e.target.value) || 0)}
                          disabled={isAutobetting}
                          className="bg-[#2f4553] border-transparent text-white font-bold h-10 pr-8"
                          placeholder="0"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-xs">%</span>
                      </div>
                    )}
                  </div>

                  {/* Stop on Profit */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#b1bad3]">Stop on Profit</div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-[#b1bad3] pointer-events-none select-none">$</div>
                      <Input
                        type="number"
                        value={stopOnProfit || ''}
                        onChange={(e) => setStopOnProfit(parseFloat(e.target.value) || 0)}
                        disabled={isAutobetting}
                        className="bg-[#2f4553] border-transparent text-white font-bold pl-8 h-10"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Stop on Loss */}
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#b1bad3]">Stop on Loss</div>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-[#b1bad3] pointer-events-none select-none">$</div>
                      <Input
                        type="number"
                        value={stopOnLoss || ''}
                        onChange={(e) => setStopOnLoss(parseFloat(e.target.value) || 0)}
                        disabled={isAutobetting}
                        className="bg-[#2f4553] border-transparent text-white font-bold pl-8 h-10"
                        placeholder="0.00"
                      />
                    </div>
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

                  {/* Start/Stop Autobet Button */}
                  <Button
                    type="button"
                    onClick={isAutobetting ? stopAutobet : startAutobet}
                    className={cn(
                      "w-full h-12 mt-2 font-black text-base shadow-[0_4px_0] active:shadow-none active:translate-y-[4px] transition-all select-none",
                      isAutobetting
                        ? "bg-[#ed4245] hover:bg-[#c73c3e] text-white shadow-[#9a2f31]"
                        : "bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] shadow-[#B8860B]"
                    )}
                  >
                    <span className="select-none pointer-events-none">
                      {isAutobetting ? "Stop Autobet" : "Start Autobet"}
                    </span>
                  </Button>
                </>
              )}

            </div>
          )}

          {/* Right Game Area */}
          <div className="flex-1 bg-[#0f212e] p-6 md:p-12 flex flex-col relative">

            {/* Game Visualization */}
            <div className="flex-1 flex flex-col justify-center items-center min-h-[300px] space-y-12">

              {/* Slider Container */}
              <div className="w-full px-4 relative group">

                {/* Scale Labels */}
                <div className="flex justify-between text-xs font-bold text-[#b1bad3] mb-8 px-2">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>

                {/* Custom Slider Track */}
                <div className="relative h-4 bg-[#2f4553] rounded-full cursor-pointer select-none shadow-inner">
                  {/* Dynamic Gradient Background - flips based on condition */}
                  <div
                    className="absolute inset-0 rounded-full opacity-100 transition-all duration-300"
                    style={{
                      background: rollCondition === 'over'
                        ? `linear-gradient(to right, #ff4d4d 0%, #ff4d4d ${rollOver}%, #00e701 ${rollOver}%, #00e701 100%)`
                        : `linear-gradient(to right, #00e701 0%, #00e701 ${rollOver}%, #ff4d4d ${rollOver}%, #ff4d4d 100%)`
                    }}
                  />

                  {/* Slider Handle (Cube) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-xl shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing z-20 hover:scale-110 transition-transform border-4 border-[#0f212e]"
                    style={{ left: `calc(${rollOver}% - 24px)` }}
                    onMouseDown={(e) => {
                      const track = e.currentTarget.parentElement;
                      if (!track) return;

                      let lastSoundTime = 0;
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = track.getBoundingClientRect();
                        const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                        const percentage = (x / rect.width) * 100;
                        updateFromRollOver(percentage);

                        // Play slider sound (throttled to every 100ms)
                        const now = Date.now();
                        if (now - lastSoundTime > 100) {
                          playSound('slider');
                          lastSoundTime = now;
                        }
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <span className="text-[#0f212e] font-bold text-xs">{rollOver.toFixed(0)}</span>
                  </div>

                  {/* Result Marker (Floating Cube) */}
                  <AnimatePresence>
                    {lastResult !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.5 }}
                        animate={{ opacity: 1, y: -45, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-14 h-14 rounded-xl shadow-2xl flex items-center justify-center z-30 border-4 border-[#0f212e]",
                          rollCondition === 'over'
                            ? (lastResult >= rollOver ? "bg-[#00e701]" : "bg-[#2f4553]")
                            : (lastResult < rollOver ? "bg-[#00e701]" : "bg-[#2f4553]")
                        )}
                        style={{ left: `calc(${lastResult}% - 28px)` }}
                      >
                        <span className={cn(
                          "font-black text-sm",
                          rollCondition === 'over'
                            ? (lastResult >= rollOver ? "text-[#0f212e]" : "text-white")
                            : (lastResult < rollOver ? "text-[#0f212e]" : "text-white")
                        )}>
                          {lastResult.toFixed(2)}
                        </span>
                        {/* Little triangle pointer */}
                        <div className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]",
                          rollCondition === 'over'
                            ? (lastResult >= rollOver ? "border-t-[#00e701]" : "border-t-[#2f4553]")
                            : (lastResult < rollOver ? "border-t-[#00e701]" : "border-t-[#2f4553]")
                        )} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Stats Inputs Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full bg-[#213743] p-4 rounded-lg border border-[#2f4553]">

                <div className="space-y-1 relative group">
                  <Label className="text-xs font-bold text-[#b1bad3] group-hover:text-white transition-colors">Multiplier</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={multiplier}
                      onChange={(e) => updateFromMultiplier(parseFloat(e.target.value))}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 focus:border-[#2f4553] focus:ring-0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-xs font-bold pointer-events-none">×</span>
                  </div>
                </div>

                <div className="space-y-1 relative group">
                  <Label className="text-xs font-bold text-[#b1bad3] group-hover:text-white transition-colors">
                    {rollCondition === 'over' ? 'Roll Over' : 'Roll Under'}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={rollOver.toFixed(2)}
                      onChange={(e) => updateFromRollOver(parseFloat(e.target.value))}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 focus:border-[#2f4553] focus:ring-0"
                    />
                    <button
                      onClick={() => {
                        playSound('slider');
                        setRollCondition(prev => prev === 'over' ? 'under' : 'over');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded bg-[#2f4553] hover:bg-[#3d5565] transition-colors"
                    >
                      <RefreshCw className="text-[#b1bad3] w-3 h-3 hover:text-white" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 relative group">
                  <Label className="text-xs font-bold text-[#b1bad3] group-hover:text-white transition-colors">Win Chance</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={winChance.toFixed(4)}
                      onChange={(e) => updateFromWinChance(parseFloat(e.target.value))}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 focus:border-[#2f4553] focus:ring-0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-xs font-bold pointer-events-none">%</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Game Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("text-[#b1bad3] hover:text-white hover:bg-[#213743]", !soundEnabled && "text-red-500")}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg">
                Shiny
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-2 bg-[#213743] px-3 py-1 rounded-full cursor-pointer hover:bg-[#2f4553] transition-colors"
                  onClick={() => setFairnessModalOpen(true)}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">Fairness</span>
                </div>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <BarChart2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Controls */}
        {isMobile && (
          <div className="fixed bottom-[64px] left-0 right-0 z-40">
            <GameControlsMobile
              betAmount={betAmount.toString()}
              setBetAmount={(val) => setBetAmount(val)}
              onBet={handleRoll}
              isBetting={isRolling}
              balance={balance}
              mainButtonLabel="Roll Dice"
            >
              {/* Multiplier and Win Chance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#b1bad3]">Multiplier</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={multiplier.toFixed(4)}
                      onChange={(e) => updateFromMultiplier(parseFloat(e.target.value))}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-medium h-10 text-sm focus:ring-0 px-3 rounded-lg hover:border-[#00e701] transition-colors"
                      step="0.0001"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#b1bad3]">Win Chance</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={winChance.toFixed(4)}
                      onChange={(e) => updateFromWinChance(parseFloat(e.target.value))}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-medium h-10 text-sm focus:ring-0 px-3 rounded-lg hover:border-[#00e701] transition-colors"
                      step="0.0001"
                    />
                  </div>
                </div>
              </div>
            </GameControlsMobile>
          </div>
        )}

      </div>

      {/* Live Bets Feed */}
      <RecentBets />

      {/* Provably Fair Modal */}
      <ProvablyFairModal
        isOpen={fairnessModalOpen}
        onClose={() => setFairnessModalOpen(false)}
        seeds={seeds}
        betHistory={betHistory}
        onRotateSeed={rotateSeed}
        onUpdateClientSeed={updateClientSeed}
      />

    </div >
  );
};

export default DiceGame;
