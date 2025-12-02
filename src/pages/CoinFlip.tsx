import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Coins, History, Volume2, VolumeX, Trophy, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';
import { Bet } from '@/types';

const CoinFlip = () => {
  const { user } = useAuth();
  const { balance, optimisticUpdate } = useWallet();
  const controls = useAnimation();
  
  // Game State
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [history, setHistory] = useState<Bet[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

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
    if (!isNaN(val) && val >= 0) {
      setBetAmount(val);
    }
  };

  const adjustBet = (factor: number | 'max' | 'min') => {
    if (factor === 'max') setBetAmount(balance);
    else if (factor === 'min') setBetAmount(1);
    else setBetAmount(prev => parseFloat((prev * (factor as number)).toFixed(2)));
  };

  const handleFlip = async () => {
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
    if (isFlipping) return;

    setIsFlipping(true);

    // 1. Optimistic Update: Deduct Stake
    optimisticUpdate(-betAmount);

    // 2. Determine Outcome (Client-side sim)
    const outcome = Math.random() > 0.5 ? 'heads' : 'tails';
    const isWin = outcome === selectedSide;
    const multiplier = 1.98; // 1% House Edge approx
    const payout = isWin ? betAmount * multiplier : 0;

    // 3. Animation
    // Reset rotation to 0 (or current modulus) to prevent winding issues, then spin
    // We want to land on: Heads = 0/360, Tails = 180
    const spins = 5;
    const baseRotate = outcome === 'heads' ? 0 : 180;
    const totalRotate = (spins * 360) + baseRotate;

    await controls.start({
      rotateY: totalRotate,
      transition: { duration: 1.5, ease: "easeOut" }
    });

    // 4. Handle Result
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

    // 5. DB Sync
    try {
      const netChange = isWin ? (payout - betAmount) : -betAmount;

      // A. Update Wallet
      const { error: walletError } = await supabase.rpc('increment_balance', {
           p_user_id: user.id,
           p_amount: netChange
      });
      
      if (walletError) console.error("Wallet sync error", walletError);

      // B. Insert Bet
      const { data: betData } = await supabase
          .from('bets')
          .insert({
            user_id: user.id,
            game_type: 'CoinFlip',
            stake_credits: betAmount,
            payout_credits: payout,
            result: isWin ? 'win' : 'loss',
            raw_data: { side: selectedSide, outcome }
          })
          .select()
          .single();

      // C. Insert Transactions
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

      if (betData) {
          setHistory(prev => [betData as unknown as Bet, ...prev].slice(0, 20));
      }

    } catch (error) {
      console.error("DB Error", error);
    } finally {
      // Reset rotation visually (optional, or keep it there)
      // controls.set({ rotateY: baseRotate }); 
      setIsFlipping(false);
    }
  };

  return (
    <div className="container py-8 min-h-[calc(100vh-64px)]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        
        {/* Main Game Panel */}
        <Card className="lg:col-span-8 border-border bg-brand-surface shadow-gold/5 relative overflow-hidden flex flex-col">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-yellow-500/5 blur-3xl pointer-events-none" />

          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-[#FFD700]" />
              <CardTitle className="text-xl font-bold">Coin Flip</CardTitle>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)} className="text-muted-foreground hover:text-white">
                 {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
               </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-between p-6 gap-12">
            
            {/* Coin Animation Area */}
            <div className="flex-1 flex items-center justify-center perspective-[1000px] py-8">
              <motion.div
                className="relative w-48 h-48"
                animate={controls}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Heads Side */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#F7D979] to-[#D9A94F] border-4 border-[#B8860B] shadow-[0_0_30px_rgba(255,215,0,0.3)] flex items-center justify-center backface-hidden">
                  <div className="w-36 h-36 rounded-full border-2 border-[#B8860B]/50 flex items-center justify-center">
                     <span className="text-5xl font-bold text-[#5C4033]">H</span>
                  </div>
                </div>
                
                {/* Tails Side */}
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-[#E0E0E0] to-[#A0A0A0] border-4 border-[#707070] shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center backface-hidden"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="w-36 h-36 rounded-full border-2 border-[#707070]/50 flex items-center justify-center">
                     <span className="text-5xl font-bold text-[#404040]">T</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="space-y-8 max-w-2xl mx-auto w-full">
              
              {/* Side Selection */}
              <div className="grid grid-cols-2 gap-4 p-1 bg-black/20 rounded-xl border border-white/5">
                <button
                  onClick={() => setSelectedSide('heads')}
                  disabled={isFlipping}
                  className={cn(
                    "flex items-center justify-center gap-3 py-4 rounded-lg transition-all font-bold text-lg",
                    selectedSide === 'heads' 
                      ? "bg-gradient-to-r from-[#F7D979] to-[#D9A94F] text-black shadow-lg" 
                      : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-[#D9A94F] border border-black/20" />
                  Heads
                </button>
                <button
                  onClick={() => setSelectedSide('tails')}
                  disabled={isFlipping}
                  className={cn(
                    "flex items-center justify-center gap-3 py-4 rounded-lg transition-all font-bold text-lg",
                    selectedSide === 'tails' 
                      ? "bg-gradient-to-r from-[#E0E0E0] to-[#A0A0A0] text-black shadow-lg" 
                      : "text-muted-foreground hover:bg-white/5"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-[#A0A0A0] border border-black/20" />
                  Tails
                </button>
              </div>

              {/* Bet Input */}
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
                    {[1, 10, 50, 100].map(amt => (
                      <Button key={amt} variant="outline" size="sm" onClick={() => adjustBet(prev => prev + amt)} className="border-white/10 bg-white/5 hover:bg-white/10 text-xs">+{amt}</Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => adjustBet('max')} className="border-white/10 bg-white/5 hover:bg-white/10 text-xs ml-auto">Max</Button>
                  </div>
                </div>

                <Button 
                  onClick={handleFlip} 
                  disabled={isFlipping || !user}
                  className={cn(
                    "w-full md:w-48 h-12 text-lg font-bold text-black shadow-gold hover:scale-105 transition-all active:scale-95 disabled:opacity-70 disabled:hover:scale-100",
                    selectedSide === 'heads' ? "bg-gold-gradient" : "bg-gradient-to-r from-gray-200 to-gray-400"
                  )}
                >
                  {isFlipping ? "Flipping..." : (!user ? "Log in to Play" : `Flip ${selectedSide === 'heads' ? 'Heads' : 'Tails'}`)}
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
              <CardTitle className="text-lg font-bold">Recent Flips</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <Table>
                <TableHeader className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-xs w-[80px]">Choice</TableHead>
                    <TableHead className="text-xs text-center">Result</TableHead>
                    <TableHead className="text-xs text-right">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow className="hover:bg-transparent border-0">
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground text-sm">
                        No flips yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((bet) => {
                      const isWin = bet.result === 'win';
                      const choice = bet.raw_data?.side || 'heads';
                      return (
                        <TableRow key={bet.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-xs font-medium capitalize flex items-center gap-2">
                             <div className={cn("w-2 h-2 rounded-full", choice === 'heads' ? "bg-yellow-500" : "bg-gray-400")} />
                             {choice}
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

export default CoinFlip;
