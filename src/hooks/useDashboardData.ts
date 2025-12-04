import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';

export const useDashboardData = () => {
  const { user } = useAuth();
  const { balance } = useWallet(); // Use global balance
  const [stats, setStats] = useState<any>(null);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Fetch Stats (RPC)
        const statsPromise = supabase
          .rpc('get_user_stats', { user_id: user.id });

        // 2. Fetch Recent Bets
        const betsPromise = supabase
          .from('bets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        // 3. Fetch Transactions
        const txPromise = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        const [statsRes, betsRes, txRes] = await Promise.all([
          statsPromise,
          betsPromise,
          txPromise
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (betsRes.data) setRecentBets(betsRes.data);
        if (txRes.data) setTransactions(txRes.data);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Realtime subscription for stats updates
    const subscription = supabase
      .channel('dashboard_stats')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sports_bets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return { wallet: { credits: balance }, stats, recentBets, transactions, loading };
};
