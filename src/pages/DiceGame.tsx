import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, BarChart2, RefreshCw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';
import { Bet } from '@/types';

const DiceGame = () => {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  
  // Game State
  const [betAmount, setBetAmount] = useState<number>(0);
  const [winChance, setWinChance] = useState<number>(49.5);
  const [rollOver, setRollOver] = useState<number>(50.5);
  const [multiplier, setMultiplier] = useState<number>(2.0000);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [history, setHistory] = useState<Bet[]>([]);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');

  // Calculate Profit
  const profitOnWin = isNaN(betAmount) ? 0 : betAmount * multiplier - betAmount;

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

  const handleBetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setBetAmount(isNaN(val) ? 0 : val);
  };

  const adjustBet = (factor: number) => {
    setBetAmount(prev => parseFloat((prev * factor).toFixed(8)));
  };

  const handleRoll = async () => {
    if (!user) return toast.error("Please log in to play");
    if (betAmount <= 0) return toast.error("Invalid bet amount");
    if (betAmount > balance) return toast.error("Insufficient balance");
    if (isRolling) return;

    setIsRolling(true);
    optimisticUpdate(-betAmount);

    // Simulate Roll
    await new Promise(resolve => setTimeout(resolve, 400));
    const result = parseFloat((Math.random() * 100).toFixed(2));
    setLastResult(result);

    const isWin = result >= rollOver; // Standard "Roll Over" logic
    const payout = isWin ? betAmount * multiplier : 0;

    if (isWin) {
      optimisticUpdate(payout);
      toast.success(`Win! ${result.toFixed(2)}`, { className: "text-green-500" });
    } else {
      toast("Loss", { description: `Rolled ${result.toFixed(2)}`, className: "text-red-500" });
    }

    // DB Sync (Optimistic UI doesn't wait for this)
    syncToDb(result, isWin, payout);
    
    setIsRolling(false);
  };

  const syncToDb = async (result: number, isWin: boolean, payout: number) => {
    try {
      const netChange = isWin ? (payout - betAmount) : -betAmount;
      
      // Update Wallet RPC
      await supabase.rpc('increment_balance', { p_user_id: user?.id, p_amount: netChange });

      // Insert Bet
      const { data: bet } = await supabase.from('bets').insert({
        user_id: user?.id,
        game_type: 'Dice',
        stake_credits: betAmount,
        payout_credits: payout,
        result: isWin ? 'win' : 'loss',
        raw_data: { roll: result, target: rollOver, condition: 'over' }
      }).select().single();

      if (bet) setHistory(prev => [bet as unknown as Bet, ...prev].slice(0, 10));
      
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0f212e] p-4 md:p-8 font-sans text-[#b1bad3]">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Main Game Interface */}
        <div className="flex flex-col lg:flex-row bg-[#1a2c38] rounded-lg overflow-hidden shadow-xl border border-[#213743]">
          
          {/* Left Control Panel */}
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

            {/* Bet Amount Input */}
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
                  className="bg-[#0f212e] border-[#2f4553] text-white font-bold pl-6 pr-24 h-10 focus-visible:ring-1 focus-visible:ring-[#2f4553]" 
                />
                <div className="absolute right-1 flex gap-1">
                  <button onClick={() => adjustBet(0.5)} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors">½</button>
                  <button onClick={() => adjustBet(2)} className="px-2 py-1 text-xs font-bold bg-[#2f4553] hover:bg-[#3d5565] rounded text-[#b1bad3] hover:text-white transition-colors">2×</button>
                </div>
              </div>
            </div>

            {/* Profit on Win (Read Only) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-[#b1bad3]">
                <span>Profit on Win</span>
                <span>{profitOnWin.toFixed(8)} LTC</span>
              </div>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-[#b1bad3] pointer-events-none select-none">$</div>
                <Input 
                  readOnly
                  value={profitOnWin.toFixed(2)}
                  className="bg-[#2f4553] border-transparent text-white font-bold pl-6 h-10 cursor-not-allowed opacity-80" 
                />
              </div>
            </div>

            {/* Bet Button */}
            <Button 
              onClick={handleRoll}
              disabled={isRolling}
              className="w-full h-12 mt-2 bg-[#00e701] hover:bg-[#00c701] text-[#0f212e] font-black text-base shadow-[0_4px_0_#00b301] active:shadow-none active:translate-y-[4px] transition-all"
            >
              {isRolling ? "Rolling..." : "Bet"}
            </Button>

          </div>

          {/* Right Game Area */}
          <div className="flex-1 bg-[#0f212e] p-6 md:p-12 flex flex-col relative">
            
            {/* Game Visualization */}
            <div className="flex-1 flex flex-col justify-center items-center min-h-[300px] space-y-12">
              
              {/* Result Display (Floating) */}
              {lastResult !== null && (
                <div 
                  className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#213743] px-6 py-3 rounded-full border-2 border-[#2f4553] shadow-2xl z-20 animate-in fade-in zoom-in duration-300"
                >
                  <span className={cn("text-4xl font-black", lastResult >= rollOver ? "text-[#00e701]" : "text-[#b1bad3]")}>
                    {lastResult.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Slider Container */}
              <div className="w-full px-4 relative group">
                
                {/* Scale Labels */}
                <div className="flex justify-between text-xs font-bold text-[#b1bad3] mb-4 px-2">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>

                {/* Custom Slider Track */}
                <div className="relative h-3 bg-[#2f4553] rounded-full cursor-pointer select-none">
                  {/* Dynamic Gradient Background */}
                  <div 
                    className="absolute inset-0 rounded-full opacity-90"
                    style={{
                      background: `linear-gradient(to right, #ff4d4d 0%, #ff4d4d ${rollOver}%, #00e701 ${rollOver}%, #00e701 100%)`
                    }}
                  />
                  
                  {/* Slider Handle */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1475e1] border-4 border-[#ffffff] rounded-lg shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing z-10 hover:scale-110 transition-transform"
                    style={{ left: `calc(${rollOver}% - 16px)` }}
                    onMouseDown={(e) => {
                      const track = e.currentTarget.parentElement;
                      if (!track) return;
                      
                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const rect = track.getBoundingClientRect();
                        const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
                        const percentage = (x / rect.width) * 100;
                        updateFromRollOver(percentage);
                      };
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                    <div className="flex gap-[2px]">
                       <div className="w-[2px] h-3 bg-white/50 rounded-full" />
                       <div className="w-[2px] h-3 bg-white/50 rounded-full" />
                       <div className="w-[2px] h-3 bg-white/50 rounded-full" />
                    </div>
                  </div>

                  {/* Result Marker on Track */}
                  {lastResult !== null && (
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow border-2 border-[#0f212e] z-0 transition-all duration-500"
                      style={{ left: `calc(${lastResult}% - 8px)` }}
                    />
                  )}
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
                 <Button variant="ghost" size="icon" className="text-[#b1bad3] hover:text-white hover:bg-[#213743]">
                    <Volume2 className="w-4 h-4" />
                 </Button>
               </div>
               
               <div className="absolute left-1/2 -translate-x-1/2 font-bold text-white tracking-tight text-lg">
                  Shiny
               </div>

               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#213743] px-3 py-1 rounded-full">
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
    </div>
  );
};

export default DiceGame;
