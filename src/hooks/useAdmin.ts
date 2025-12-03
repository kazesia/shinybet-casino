import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { AdminStats, Profile, Withdrawal, AppSetting, Bet, Deposit } from '@/types';

// --- Queries ---

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_summary');
      if (error) throw error;
      return data as AdminStats;
    },
  });
};

export const useAdminUsers = (page = 0, pageSize = 20, search = '') => {
  return useQuery({
    queryKey: ['admin', 'users', page, pageSize, search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*, wallets(credits)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`username.ilike.%${search}%,id.eq.${search},email.ilike.%${search}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      
      const users = data.map((u: any) => ({
        ...u,
        wallet_balance: u.wallets?.[0]?.credits || 0
      }));

      return { users: users as Profile[], count: count || 0 };
    },
    placeholderData: (previousData) => previousData,
  });
};

// Fetch specific user stats for the admin view
export const useUserStats = (userId: string | null) => {
  return useQuery({
    queryKey: ['admin', 'user-stats', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      // 1. Get Stats
      const { data: stats, error: statsError } = await supabase
        .rpc('get_user_stats', { user_id: userId });
        
      if (statsError) throw statsError;

      // 2. Get Recent Activity
      const { data: activity, error: activityError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      return {
        stats,
        recentActivity: activity
      };
    },
    enabled: !!userId
  });
};

export const useAdminWithdrawals = (status: string) => {
  return useQuery({
    queryKey: ['admin', 'withdrawals', status],
    queryFn: async () => {
      let query = supabase
        .from('withdrawals')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Withdrawal[];
    },
  });
};

export const useAdminDeposits = () => {
  return useQuery({
    queryKey: ['admin', 'deposits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposits')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Deposit[];
    },
  });
};

export const useAdminBets = (gameType = 'all') => {
  return useQuery({
    queryKey: ['admin', 'bets', gameType],
    queryFn: async () => {
      let query = supabase
        .from('bets')
        .select('*, profiles(username)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (gameType !== 'all') {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Bet[];
    },
  });
};

export const useAdminSettings = () => {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').order('key');
      if (error) throw error;
      return data as AppSetting[];
    },
  });
};

// --- Mutations ---

export const useAdminMutations = () => {
  const queryClient = useQueryClient();

  const toggleBan = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: boolean }) => {
      const { error } = await supabase.rpc('admin_toggle_ban', { p_user_id: userId, p_status: status });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User ban status updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.rpc('admin_change_role', { p_user_id: userId, p_role: role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const approveWithdrawal = useMutation({
    mutationFn: async ({ id, txHash }: { id: string; txHash: string }) => {
      const { error } = await supabase.rpc('admin_approve_withdrawal', { p_withdrawal_id: id, p_tx_hash: txHash });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      toast.success('Withdrawal approved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectWithdrawal = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.rpc('admin_reject_withdrawal', { p_withdrawal_id: id, p_reason: reason });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'withdrawals'] });
      toast.success('Withdrawal rejected');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateSettings = useMutation({
    mutationFn: async (settings: AppSetting[]) => {
      const { error } = await supabase.from('settings').upsert(settings);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Settings saved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  return {
    toggleBan,
    changeRole,
    approveWithdrawal,
    rejectWithdrawal,
    updateSettings
  };
};
