import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, BarChart2, Volume2, TrendingUp, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useUI } from '@/context/UIContext';
import { toast } from 'sonner';
import CrashCanvas from '@/components/games/crash/CrashCanvas';
import { RecentBets } from '@/components/games/RecentBets';

// Configuration
const HOUSE_EDGE = 0.04; // 4% chance to crash instantly at 1.00x
const GROWTH_RATE = 0.00006; // Speed of the multiplier growth

export default function CrashGame() {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const { openFairnessModal } = useUI();

  // Game State
  const [gameState, setGameState] = useState<'idle' | 'starting' | 'running' | 'crashed'>('idle');
  const [multiplier, setMultiplier] = useState(1.00);
  const [betAmount, setBetAmount] = useState<number>(0);
  const [autoCashout, setAutoCashout] = useState<number>(2.00);
  const [startTime, setStartTime] = useState<number>(0);
  const [crashPoint, setCrashPoint] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Player State
  const [hasBet, setHasBet] = useState(false);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [cashedOutAt, setCashedOutAt] = useState(0);

  // History
  const [history, setHistory] = useState<{ id: string, crash: number }[]>([]);

  const requestRef = useRef<number | undefined>(undefined);

  // --- Game Loop ---
  useEffect(() => {
    if (gameState === 'running') {
      const loop = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        setTimeElapsed(elapsed);

        // Calculate current multiplier: M = e^(k*t)
        const nextMult = Math.pow(Math.E, GROWTH_RATE * elapsed);

        setMultiplier(nextMult);

        // Check Auto Cashout
        if (hasBet && !hasCashedOut && nextMult >= autoCashout && autoCashout > 1) {
          handleCashout(nextMult); // Pass specific value to avoid state race
        }

        // Check Crash
        if (nextMult >= crashPoint) {
          handleCrash(crashPoint);
        } else {
          requestRef.current = requestAnimationFrame(loop);
        }
      };
      requestRef.current = requestAnimationFrame(loop);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, startTime, crashPoint, hasBet, hasCashedOut, autoCashout]);

  // --- Handlers ---

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBetAmount(isNaN(val) ? 0 : val);
  };

  const adjustBet = (factor: number) => {
    setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
  };

  const startGame = async () => {
    if (!user) return toast.error("Please log in to play");
    if (betAmount <= 0) return toast.error("Invalid bet amount");
    if (betAmount > balance) return toast.error("Insufficient balance");

    // 1. Deduct Balance
    optimisticUpdate(-betAmount);
    setHasBet(true);
    setHasCashedOut(false);
    setCashedOutAt(0);

    // 2. Prepare Game
    setGameState('starting');
    setMultiplier(1.00);
    setTimeElapsed(0);

    // 3. Determine Crash Point (Client-side simulation of server seed)
    // In production, this comes from a hash chain
    const isInstantCrash = Math.random() < HOUSE_EDGE;
    let calculatedCrash = 1.00;

    if (!isInstantCrash) {
      // Generate random crash point based on inverse distribution
      // M = 0.99 / (1 - random)
      const r = Math.random();
      calculatedCrash = Math.max(1.00, 0.99 / (1 - r));
    }
    setCrashPoint(calculatedCrash);

    // 4. Start Countdown
    setTimeout(() => {
      setStartTime(Date.now());
      setGameState('running');
    }, 1000);
  };

  const handleCashout = (currentMult = multiplier) => {
    if (hasCashedOut || gameState !== 'running') return;

    setHasCashedOut(true);
    setCashedOutAt(currentMult);

    const payout = betAmount * currentMult;
    optimisticUpdate(payout);

    // toast.success(`Cashed out at ${currentMult.toFixed(2)}x`, {
    //   description: `Won ${payout.toFixed(4)}`,
    //   className: "bg-green-500/10 border-green-500 text-green-500 font-bold"
    // });

    // Sync Win
    syncToDb(betAmount, payout, currentMult, 'win');
  };

  const handleCrash = (finalCrash: number) => {
    setGameState('crashed');
    setMultiplier(finalCrash);

    // Add to history
    setHistory(prev => [{ id: Date.now().toString(), crash: finalCrash }, ...prev].slice(0, 10));

    if (hasBet && !hasCashedOut) {
      // toast.error("Crashed!", { description: `Lost ${betAmount.toFixed(4)}` });
      // Sync Loss
      syncToDb(betAmount, 0, 0, 'loss');
    }

    setHasBet(false);
  };

  const syncToDb = async (stake: number, payout: number, mult: number, result: 'win' | 'loss') => {
    try {
      const netChange = result === 'win' ? (payout - stake) : -stake;
      await supabase.rpc('increment_balance', { p_user_id: user?.id, p_amount: netChange });

      await supabase.from('bets').insert({
        user_id: user?.id,
        game_type: 'Crash',
        stake_credits: stake,
        payout_credits: payout,
        result: result,
        raw_data: { crash_point: crashPoint, cashed_out_at: mult }
      });
    } catch (e) {
      console.error(e);
    }
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
              <button className="flex-1 py-2 text-sm font-bold rounded-full bg-[#2f4553] text-white shadow-md transition-all">
                Manual
              </button>
              <button className="flex-1 py-2 text-sm font-bold rounded-full text-[#b1bad3] hover:text-white transition-all">
                Auto
              </button>
            </div>

            {/* Bet Amount */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                <span>Bet Amount</span>
                <span>{betAmount.toFixed(2)} USD</span>
              </div>
              <div className="relative flex items-center">
                <Input
                  type="number"
                  value={betAmount === 0 ? '' : betAmount}
                  onChange={handleBetAmountChange}
                  disabled={hasBet && gameState !== 'crashed' && gameState !== 'idle'}
                  className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-4 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553] disabled:opacity-50"
                  placeholder="0"
                />
                <div className="absolute right-1 flex gap-1">
                  <button onClick={() => adjustBet(0.5)} disabled={hasBet} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">½</button>
                  <button onClick={() => adjustBet(2)} disabled={hasBet} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors disabled:opacity-50">2×</button>
                </div>
              </div>
            </div>

            {/* Auto Cashout */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#b1bad3]">Auto Cashout</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={autoCashout}
                  onChange={(e) => setAutoCashout(parseFloat(e.target.value))}
                  disabled={hasBet}
                  className="bg-[#0f212e] border-[#2f4553] text-white font-bold h-10 focus:border-[#2f4553] focus:ring-0 disabled:opacity-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] text-xs font-bold pointer-events-none">×</span>
              </div>
            </div>

            {/* Action Button */}
            {gameState === 'running' && hasBet && !hasCashedOut ? (
              <Button
                onClick={() => handleCashout()}
                className="w-full h-12 mt-2 bg-[#F7D979] hover:bg-[#e5c565] text-black font-black text-base shadow-[0_4px_0_#b17827] active:shadow-none active:translate-y-[4px] transition-all"
              >
                CASHOUT ({(betAmount * multiplier).toFixed(2)})
              </Button>
            ) : (
              <Button
                onClick={startGame}
                disabled={gameState === 'starting' || (gameState === 'running' && !hasBet)}
                className={cn(
                  "w-full h-12 mt-2 font-black text-base shadow-[0_4px_0_#00b301] active:shadow-none active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  gameState === 'running' ? "bg-[#2f4553] text-[#b1bad3] shadow-none" : "bg-[#00e701] hover:bg-[#00c701] text-[#0f212e]"
                )}
              >
                {gameState === 'starting' ? "Starting..." : gameState === 'running' ? "Wait for next round" : "Bet"}
              </Button>
            )}

            {/* Profit Info */}
            <div className="space-y-1 mt-2">
              <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                <span>Total Profit</span>
                <span>{hasCashedOut ? (betAmount * cashedOutAt - betAmount).toFixed(8) : '0.00000000'}</span>
              </div>
            </div>

          </div>

          {/* RIGHT: Game Area */}
          <div className="flex-1 bg-[#0f212e] relative flex flex-col min-h-[500px]">

            {/* Graph Container */}
            <div className="flex-1 relative overflow-hidden p-4">

              {/* Multiplier Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="text-center">
                  <div className={cn(
                    "text-6xl md:text-8xl font-black tracking-tighter tabular-nums transition-colors duration-100",
                    gameState === 'crashed' ? "text-[#ef4444]" :
                      gameState === 'running' ? "text-white" :
                        "text-[#b1bad3]"
                  )}>
                    {multiplier.toFixed(2)}x
                  </div>
                  {gameState === 'crashed' && (
                    <div className="text-[#ef4444] font-bold text-lg uppercase mt-2 animate-bounce">Crashed</div>
                  )}
                  {hasCashedOut && (
                    <div className="text-[#00e701] font-bold text-lg uppercase mt-2 bg-[#00e701]/10 px-4 py-1 rounded-full inline-block">
                      You Won {(betAmount * cashedOutAt).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {/* Canvas */}
              <CrashCanvas gameState={gameState} multiplier={multiplier} timeElapsed={timeElapsed} />
            </div>

            {/* Footer Controls */}
            <div className="h-12 bg-[#0f212e] border-t border-[#213743] flex items-center justify-between px-4 z-20">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Settings2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#ef4444]" /> Crash
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

        {/* History Bar */}
        <div className="bg-[#1a2c38] rounded-lg border border-[#213743] p-4 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-[#b1bad3] font-bold text-sm shrink-0">
            <History className="w-4 h-4" /> Recent
          </div>
          <div className="flex gap-2">
            {history.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold font-mono",
                  item.crash >= 10 ? "bg-[#F7D979] text-black" :
                    item.crash >= 2 ? "bg-[#00e701] text-black" :
                      "bg-[#2f4553] text-[#b1bad3]"
                )}
              >
                {item.crash.toFixed(2)}x
              </div>
            ))}
            {history.length === 0 && <span className="text-xs text-[#b1bad3]/50">No history yet</span>}
          </div>
        </div>

        {/* Recent Bets */}
        <RecentBets gameType="Crash" />

      </div>
    </div>
  );
}
