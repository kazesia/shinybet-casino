import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBetSlip } from '@/context/BetSlipContext';
import { Trash2, Loader2, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';

export default function BetSlip() {
  const { selections, isOpen, setIsOpen, removeSelection, clearSlip, placeBet, isPlacing } = useBetSlip();
  const { user } = useAuth();
  const { openAuthModal } = useUI();
  const { balance } = useWallet();
  const [stakePerBet, setStakePerBet] = useState<string>('');

  // Logic for Singles
  const stakeNum = parseFloat(stakePerBet || '0');
  
  // Total Stake = Stake per bet * Number of bets
  const totalStake = stakeNum * selections.length;
  
  // Calculate potential payout (Sum of individual payouts)
  const potentialPayout = selections.reduce((acc, curr) => {
    return acc + (stakeNum * curr.odds);
  }, 0);

  const handleMaxBet = () => {
    if (selections.length === 0) return;
    if (balance <= 0) {
      setStakePerBet('0');
      return;
    }
    // Split available balance evenly across all selections
    // Floor to 2 decimals to avoid floating point issues
    const maxPerBet = Math.floor((balance / selections.length) * 100) / 100;
    setStakePerBet(maxPerBet.toString());
  };

  const handlePlaceBet = () => {
    if (totalStake > balance) {
      toast.error("Insufficient balance", {
        description: `Total stake (${totalStake.toFixed(2)}) exceeds balance (${balance.toFixed(2)})`
      });
      return;
    }
    if (stakeNum <= 0) {
      toast.error("Invalid stake amount");
      return;
    }
    placeBet(stakeNum);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:w-[400px] bg-[#1a2c38] border-l border-white/10 p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-white/5">
          <SheetTitle className="text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              Bet Slip 
              <span className="bg-[#F7D979] text-black text-xs px-2 py-0.5 rounded-full">{selections.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {selections.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearSlip} 
                  className="h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </Button>
              )}
              <span className="text-xs font-normal text-muted-foreground bg-[#0f212e] px-2 py-1 rounded border border-white/5">
                Singles
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-6">
          {selections.length === 0 ? (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 opacity-50" />
              </div>
              <div>
                <p className="font-bold text-white">Your bet slip is empty</p>
                <p className="text-sm">Select odds from the sportsbook to start betting.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selections.map((selection) => (
                <div key={selection.eventId} className="bg-[#0f212e] p-4 rounded-lg border border-white/5 relative group hover:border-[#F7D979]/30 transition-colors">
                  <button 
                    onClick={() => removeSelection(selection.eventId)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f212e] p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="pr-6">
                    <div className="text-sm font-bold text-white mb-1">{selection.selection}</div>
                    <div className="text-xs text-muted-foreground mb-3">{selection.eventTitle}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase tracking-wider bg-[#213743] px-2 py-1 rounded text-[#b1bad3]">{selection.marketKey}</span>
                      <span className="font-bold text-[#F7D979] text-lg">{selection.odds.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {selections.length > 0 && (
          <div className="p-6 bg-[#0f212e] border-t border-white/5 space-y-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stake per bet</span>
                <span className="text-xs text-[#b1bad3]">
                  Balance: <span className="text-white font-mono">${balance.toFixed(2)}</span>
                </span>
              </div>
              
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={stakePerBet}
                  onChange={(e) => setStakePerBet(e.target.value)}
                  className="bg-[#1a2c38] border-white/10 pr-16 font-bold text-white focus-visible:ring-[#F7D979]"
                />
                <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-auto py-1 px-2 text-[10px] font-bold text-[#F7D979] hover:bg-[#F7D979]/10 hover:text-[#F7D979]"
                    onClick={handleMaxBet}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Stake</span>
                  <span className="text-white font-mono">${totalStake.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Est. Payout</span>
                  <span className="text-[#00e701] font-bold font-mono">${potentialPayout.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {user ? (
              <Button 
                className="w-full h-12 text-base bg-[#F7D979] text-black font-bold hover:bg-[#F7D979]/90 shadow-[0_0_20px_rgba(247,217,121,0.2)]"
                onClick={handlePlaceBet}
                disabled={!stakePerBet || parseFloat(stakePerBet) <= 0 || isPlacing || totalStake > balance}
              >
                {isPlacing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Placing Bets...
                  </>
                ) : (
                  `Place ${selections.length} Bet${selections.length > 1 ? 's' : ''}`
                )}
              </Button>
            ) : (
              <Button 
                className="w-full h-12 bg-[#1475e1] text-white font-bold hover:bg-[#1475e1]/90"
                onClick={() => openAuthModal('login')}
              >
                Login to Bet
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
