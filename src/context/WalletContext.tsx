import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface Wallet {
  id: string;
  user_id: string;
  credits: number;
  version: number;
}

interface WalletContextType {
  balance: number;
  loading: boolean;
  refreshBalance: () => Promise<void>;
  optimisticUpdate: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType>({
  balance: 0,
  loading: true,
  refreshBalance: async () => { },
  optimisticUpdate: () => { },
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const prevBalanceRef = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true);

  const fetchBalance = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        // We don't trigger visual feedback on initial fetch
        // Ensure we default to 0 if credits is null/undefined to prevent NaN issues downstream
        const safeCredits = data.credits ?? 0;
        setBalance(safeCredits);
        prevBalanceRef.current = safeCredits;
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Allow components to update balance instantly for UI responsiveness
  const optimisticUpdate = (amount: number) => {
    // Safety check: Prevent NaN from poisoning the balance state
    if (isNaN(amount)) return;

    setBalance(prev => {
      let newBal = parseFloat((prev + amount).toFixed(2));
      if (newBal < 0) newBal = 0; // Prevent negative balance
      prevBalanceRef.current = newBal; // Update ref to prevent double-toast on sync
      return newBal;
    });
  };

  const updateBalanceFromSubscription = (newBalance: number) => {
    // Only update if there's a significant difference to avoid jitter from optimistic updates
    // or if the update comes from an external source (deposit/withdrawal)
    const diff = newBalance - prevBalanceRef.current;

    if (Math.abs(diff) > 0.01) {
      // If the difference is positive and we haven't just optimistically added it
      // (This logic can be complex, for now we trust the DB as source of truth eventually)
      setBalance(newBalance);
      prevBalanceRef.current = newBalance;

      // Optional: Toast for external deposits
      if (diff > 0 && !isFirstLoad.current) {
        // We might want to suppress this if it was a game win we already handled
        // For now, we'll leave it to the game component to handle win toasts
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchBalance();
      isFirstLoad.current = false;

      // Real-time subscription
      const channel = supabase
        .channel('global-wallet-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: RealtimePostgresChangesPayload<Wallet>) => {
            if (payload.new && 'credits' in payload.new) {
              updateBalanceFromSubscription(payload.new.credits);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setBalance(0);
      setLoading(false);
    }
  }, [user]);

  return (
    <WalletContext.Provider value={{ balance, loading, refreshBalance: fetchBalance, optimisticUpdate }}>
      {children}
    </WalletContext.Provider>
  );
};
