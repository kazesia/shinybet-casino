import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, BarChart2, RefreshCw, Volume2, VolumeX } from 'lucide-react';
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

const DiceGame = () => {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const { openFairnessModal } = useUI();
  const { isMobile } = useViewport();

  // Game State
  const [betAmount, setBetAmount] = useState<number | string>(0);
  const [winChance, setWinChance] = useState<number>(49.5);
  const [rollOver, setRollOver] = useState<number>(50.5);
  const [multiplier, setMultiplier] = useState<number>(2.0000);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [history, setHistory] = useState<Bet[]>([]);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio Refs
  const winSound = useRef(new Audio('/sounds/win.mp3'));
  const loseSound = useRef(new Audio('/sounds/lose.mp3'));
  const clickSound = useRef(new Audio('/sounds/click.mp3'));
  const sliderSound = useRef(new Audio('/sounds/slider.mp3'));

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

  const playSound = (type: 'win' | 'lose' | 'click' | 'slider') => {
    if (!soundEnabled) return;
    try {
      if (type === 'win') {
        winSound.current.currentTime = 0;
        winSound.current.play();
      } else if (type === 'lose') {
        loseSound.current.currentTime = 0;
        loseSound.current.play();
      } else if (type === 'click') {
        clickSound.current.currentTime = 0;
        clickSound.current.play();
      } else if (type === 'slider') {
        sliderSound.current.currentTime = 0;
        sliderSound.current.volume = 0.3; // Lower volume for slider
        sliderSound.current.play();
      }
    } catch (e) {
      console.error("Audio play failed", e);
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

    playSound('click');
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
          condition: 'over'
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
      setIsRolling(false);
    }
  };

  // syncToDb is no longer needed as RPC handles it
  // const syncToDb = ... (removed)

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
                className="w-full h-12 mt-2 bg-[#FFD700] hover:bg-[#DAA520] text-[#0f212e] font-black text-base shadow-[0_4px_0_#B8860B] active:shadow-none active:translate-y-[4px] transition-all"
              >
                {isRolling ? "Rolling..." : "Bet"}
              </Button>

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
                  {/* Dynamic Gradient Background (Red to Green) */}
                  <div
                    className="absolute inset-0 rounded-full opacity-100"
                    style={{
                      background: `linear-gradient(to right, #ff4d4d 0%, #ff4d4d ${rollOver}%, #00e701 ${rollOver}%, #00e701 100%)`
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
                          lastResult >= rollOver ? "bg-[#00e701]" : "bg-[#2f4553]"
                        )}
                        style={{ left: `calc(${lastResult}% - 28px)` }}
                      >
                        <span className={cn("font-black text-sm", lastResult >= rollOver ? "text-[#0f212e]" : "text-white")}>
                          {lastResult.toFixed(2)}
                        </span>
                        {/* Little triangle pointer */}
                        <div className={cn(
                          "absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]",
                          lastResult >= rollOver ? "border-t-[#00e701]" : "border-t-[#2f4553]"
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
                  <Label className="text-xs font-bold text-[#b1bad3] group-hover:text-white transition-colors">Roll Over</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={rollOver.toFixed(2)}
                      onChange={(e) => updateFromRollOver(parseFloat(e.target.value))}
                      className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 focus:border-[#2f4553] focus:ring-0"
                    />
                    <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] w-4 h-4 cursor-pointer hover:text-white" onClick={() => updateFromRollOver(100 - rollOver)} />
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
                  onClick={openFairnessModal}
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

        {/* Recent Bets / History (Below Game) */}
        <div className="bg-[#1a2c38] rounded-lg border border-[#213743] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-[#213743]">
            <h3 className="text-white font-bold">Recent Bets</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-[#b1bad3] hover:text-white">My Bets</Button>
              <Button variant="ghost" size="sm" className="text-[#b1bad3] hover:text-white">All Bets</Button>
              <Button variant="ghost" size="sm" className="text-[#b1bad3] hover:text-white">High Rollers</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-[#b1bad3] bg-[#0f212e] uppercase">
                <tr>
                  <th className="px-6 py-3">Game</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3 text-right">Bet Amount</th>
                  <th className="px-6 py-3 text-right">Multiplier</th>
                  <th className="px-6 py-3 text-right">Payout</th>
                </tr>
              </thead>
              <tbody>
                {history.map((bet) => (
                  <tr key={bet.id} className="bg-[#1a2c38] border-b border-[#213743] hover:bg-[#213743]">
                    <td className="px-6 py-4 font-medium text-white">Dice</td>
                    <td className="px-6 py-4 text-[#b1bad3]">{user?.email?.split('@')[0] || 'Hidden'}</td>
                    <td className="px-6 py-4 text-[#b1bad3]">{new Date(bet.created_at).toLocaleTimeString()}</td>
                    <td className="px-6 py-4 text-right text-white font-mono">{bet.stake_credits.toFixed(8)}</td>
                    <td className="px-6 py-4 text-right text-[#b1bad3]">{(bet.payout_credits / bet.stake_credits).toFixed(2)}x</td>
                    <td className={cn("px-6 py-4 text-right font-bold", bet.result === 'win' ? "text-[#00e701]" : "text-[#b1bad3]")}>
                      {bet.result === 'win' ? `+${bet.payout_credits.toFixed(8)}` : '0.00000000'}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-[#b1bad3]">No bets yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Live Bets */}
      <RecentBets />

    </div>
  );
};

export default DiceGame;
