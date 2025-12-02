import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Dices, RefreshCw, History, Volume2, VolumeX, Trophy, Ban } from 'lucide-react';
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
  const [betAmount, setBetAmount] = useState<number>(10);
  const [chance, setChance] = useState<number>(50);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [history, setHistory] = useState<Bet[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Derived State
  const multiplier = 99 / chance;
  const potentialWin = betAmount * multiplier;

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
      .limit(20);
    
    if (data) setHistory(data as unknown as Bet[]);
  };

  const handleSliderChange = (value: number[]) => {
    setChance(value[0]);
  };

  const handleBetInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= 0) {
      setBetAmount(val);
    }
  };

  const adjustBet = (factor: number | 'max' | 'min') => {
    if (factor === 'max') setBetAmount(balance);
    else if (factor === 'min') setBetAmount(1);
    else setBetAmount(prev => parseFloat((prev * (factor as number)).toFixed(2)));
  };

  const handleRoll = async () => {
    if (!user) {
      toast.error("Please log in to play");
      return;
    }
    if (betAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (betAmount <= 0) {
      toast.error("Invalid bet amount");
      return;
    }
    if (isRolling) return;

    setIsRolling(true);
    setLastResult(null);

    // 1. Optimistic Update: Deduct Stake Immediately
    optimisticUpdate(-betAmount);

    // Simulate network delay for suspense
    await new Promise(resolve => setTimeout(resolve, 600));

    // 2. Calculate Result (Client-side simulation)
    // In a real app, this should come from a serverless function to prevent cheating
    const result = Math.random() * 100;
    const finalResult = parseFloat(result.toFixed(2));
    const isWin = finalResult < chance;
    const payout = isWin ? potentialWin : 0;

    setLastResult(finalResult);

    // 3. Optimistic Update: Credit Win Immediately
    if (isWin) {
      optimisticUpdate(payout);
      toast.success(`You won ${payout.toFixed(2)} Credits!`, {
        icon: <Trophy className="w-5 h-5 text-yellow-500" />,
        className: "border-green-500 bg-green-500/10 text-green-500 font-bold"
      });
    } else {
       toast("Better luck next time", {
         icon: <Ban className="w-5 h-5 text-red-500" />,
         className: "border-red-500 bg-red-500/10 text-red-500"
       });
    }

    try {
      // 4. Perform DB Operations in Background
      // A. Update Wallet (Source of Truth)
      // We calculate the NET change to update the DB
      const netChange = isWin ? (payout - betAmount) : -betAmount;
      
      // Note: We fetch the latest balance from DB in the query to ensure atomicity if possible, 
      // but Supabase JS client updates usually overwrite. 
      // A robust solution uses an RPC `increment_balance`. For now, we use standard update.
      
      // We don't await this to keep UI snappy, but we should catch errors
      const dbOperations = async () => {
        let { error: walletError } = await supabase.rpc('increment_balance', {
             p_user_id: user.id,
             p_amount: netChange
        });

        // Fallback if RPC fails (e.g. function not found)
        if (walletError) {
            const { data: freshWallet } = await supabase.from('wallets').select('credits').eq('user_id', user.id).single();
            if (freshWallet) {
                const { error: fallbackError } = await supabase
                .from('wallets')
                .update({ credits: freshWallet.credits + netChange })
                .eq('user_id', user.id);
                walletError = fallbackError;
            }
        }

        if (walletError) console.error("Wallet sync error", walletError);

        // B. Insert Bet Record
        const { data: betData, error: betError } = await supabase
            .from('bets')
            .insert({
            user_id: user.id,
            game_type: 'Dice',
            stake_credits: betAmount,
            payout_credits: payout,
            result: isWin ? 'win' : 'loss'
            })
            .select()
            .single();

        if (betError) console.error("Bet insert error", betError);

        // C. Insert Transaction
        await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'bet',
            amount_credits: betAmount
        });

        if (isWin) {
            await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'payout',
            amount_credits: payout
            });
        }

        // Update local history
        if (betData) {
            setHistory(prev => [betData as unknown as Bet, ...prev].slice(0, 20));
        }
      };

      dbOperations();

    } catch (error: any) {
      console.error('Game Error:', error);
      toast.error("Game sync error: " + error.message);
      // Revert optimistic update on critical failure?
      // In production, we would force a refreshBalance() here.
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <div className="container py-8 min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* Main Game Panel */}
        <Card className="lg:col-span-8 border-border bg-brand-surface shadow-gold/5 relative overflow-hidden flex flex-col">
           {/* Background Glow */}
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/5 blur-3xl pointer-events-none" />

          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Dices className="w-6 h-6 text-primary" />
              <CardTitle className="text-xl font-bold">Dice</CardTitle>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="text-muted-foreground hover:text-white">
                 {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
               </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between p-6 gap-8">
            
            {/* Result Display Area */}
            <div className="relative h-48 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {lastResult !== null ? (
                  <motion.div
                    key="result"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="text-center z-10"
                  >
                    <div className={cn(
                      "text-6xl font-black tracking-tighter drop-shadow-2xl",
                      lastResult < chance ? "text-brand-success" : "text-brand-danger"
                    )}>
                      {lastResult.toFixed(2)}
                    </div>
                    <div className={cn(
                      "text-sm font-bold uppercase tracking-widest mt-2",
                       lastResult < chance ? "text-brand-success/80" : "text-brand-danger/80"
                    )}>
                      {lastResult < chance ? "Win" : "Loss"}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center z-10"
                  >
                    <div className="text-6xl font-black text-white/10 tracking-tighter">
                      {isRolling ? "..." : "00.00"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Slider Visual Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-2 bg-brand-danger/20">
                 <motion.div 
                    className="h-full bg-brand-success shadow-[0_0_20px_rgba(44,227,143,0.5)]"
                    initial={false}
                    animate={{ width: `${chance}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 />
              </div>
              
              {/* Result Marker */}
              {lastResult !== null && (
                <motion.div 
                  className="absolute bottom-0 w-1 h-full bg-white/50 z-0"
                  initial={{ left: '50%' }}
                  animate={{ left: `${lastResult}%` }}
                />
              )}
            </div>

            {/* Game Controls */}
            <div className="space-y-8">
              {/* Slider Control */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                <div className="flex justify-between mb-4 text-sm font-medium text-brand-textSecondary">
                  <span>0</span>
                  <span>25</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100</span>
                </div>
                <Slider
                  value={[chance]}
                  min={1}
                  max={95}
                  step={1}
                  onValueChange={handleSliderChange}
                  className="cursor-pointer py-4"
                />
                <div className="grid grid-cols-3 gap-4 mt-6">
                   <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Win Chance</div>
                      <div className="text-xl font-bold text-white">{chance}%</div>
                   </div>
                   <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Multiplier</div>
                      <div className="text-xl font-bold text-white">{multiplier.toFixed(4)}x</div>
                   </div>
                   <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Win Amount</div>
                      <div className="text-xl font-bold text-brand-success">{(betAmount * multiplier).toFixed(2)}</div>
                   </div>
                </div>
              </div>

              {/* Bet Input & Action */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between">
                    <Label className="text-brand-textSecondary">Bet Amount</Label>
                    <span className="text-xs text-muted-foreground">Balance: {balance.toFixed(2)}</span>
                  </div>
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={betAmount} 
                      onChange={handleBetInputChange}
                      className="bg-black/20 border-white/10 h-12 text-lg font-bold pl-4 pr-20 focus-visible:ring-primary/50"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => adjustBet(0.5)} className="h-full px-2 text-xs text-muted-foreground hover:text-white">1/2</Button>
                        <Button variant="ghost" size="sm" onClick={() => adjustBet(2)} className="h-full px-2 text-xs text-muted-foreground hover:text-white">2x</Button>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {[0.1, 1, 10, 100].map(amt => (
                      <Button key={amt} variant="outline" size="sm" onClick={() => adjustBet(prev => prev + amt)} className="border-white/10 bg-white/5 hover:bg-white/10 text-xs">+{amt}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => adjustBet('max')} className="border-white/10 bg-white/5 hover:bg-white/10 text-xs ml-auto">Max</Button>
                  </div>
                </div>

                <Button 
                  onClick={handleRoll} 
                  disabled={isRolling || !user}
                  className="w-full md:w-48 h-12 text-lg font-bold bg-gold-gradient text-black shadow-gold hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {isRolling ? <RefreshCw className="w-5 h-5 animate-spin" /> : (!user ? "Log in to Play" : "Roll Dice")}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* History Panel */}
        <Card className="lg:col-span-4 border-border bg-brand-surface h-[600px] lg:h-auto flex flex-col">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg font-bold">My Bets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <Table>
                <TableHeader className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs w-[80px]">Time</TableHead>
                    <TableHead className="text-xs text-center">Result</TableHead>
                    <TableHead className="text-xs text-right">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-sm">
                        No bets yet. Start rolling!
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((bet) => {
                      const isWin = bet.result === 'win';
                      return (
                        <TableRow key={bet.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                              "min-w-[60px] justify-center border-0 font-mono font-bold",
                              isWin ? "bg-brand-success/10 text-brand-success" : "bg-brand-danger/10 text-brand-textSecondary"
                            )}>
                              {isWin ? 'WIN' : 'LOSS'}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(
                            "text-right text-xs font-bold font-mono",
                            isWin ? "text-brand-success" : "text-muted-foreground"
                          )}>
                            {isWin ? `+${bet.payout_credits.toFixed(2)}` : `-${bet.stake_credits}`}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default DiceGame;
