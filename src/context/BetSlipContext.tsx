import React, { createContext, useContext, useState } from 'react';
import { BetSelection } from '@/types/sports';
import { toast } from 'sonner';
import { sportsApi } from '@/api/sports';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';

interface BetSlipContextType {
  selections: BetSelection[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addSelection: (selection: BetSelection) => void;
  removeSelection: (eventId: string) => void;
  clearSlip: () => void;
  placeBet: (stake: number) => Promise<void>;
  isPlacing: boolean;
}

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export const useBetSlip = () => {
  const context = useContext(BetSlipContext);
  if (!context) throw new Error('useBetSlip must be used within a BetSlipProvider');
  return context;
};

export const BetSlipProvider = ({ children }: { children: React.ReactNode }) => {
  const [selections, setSelections] = useState<BetSelection[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const { refreshBalance } = useWallet();
  const { user } = useAuth();

  const addSelection = (selection: BetSelection) => {
    setSelections(prev => {
      const filtered = prev.filter(s => s.eventId !== selection.eventId);
      return [...filtered, selection];
    });
    setIsOpen(true);
    toast.success(`Added ${selection.selection} @ ${selection.odds}`);
  };

  const removeSelection = (eventId: string) => {
    setSelections(prev => prev.filter(s => s.eventId !== eventId));
  };

  const clearSlip = () => setSelections([]);

  const placeBet = async (stake: number) => {
    if (selections.length === 0) return;
    if (!user) {
      toast.error("Please login to place bets");
      return;
    }
    setIsPlacing(true);

    try {
      for (const selection of selections) {
        await sportsApi.placeBet(user.id, {
          eventId: selection.eventId,
          selection: selection.selection,
          odds: selection.odds,
          stake: stake,
          sportKey: selection.sportKey,
          homeTeam: selection.homeTeam,
          awayTeam: selection.awayTeam,
          commenceTime: selection.commenceTime
        });
      }
      
      toast.success('Bet placed successfully!');
      clearSlip();
      setIsOpen(false);
      refreshBalance();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to place bet');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <BetSlipContext.Provider value={{
      selections,
      isOpen,
      setIsOpen,
      addSelection,
      removeSelection,
      clearSlip,
      placeBet,
      isPlacing
    }}>
      {children}
    </BetSlipContext.Provider>
  );
};
