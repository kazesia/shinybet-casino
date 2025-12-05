import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface VipReward {
    id: string;
    period: 'weekly' | 'monthly';
    reward_type: 'wagerback' | 'cashback';
    reward_amount: number;
    tier_name: string;
    start_date: string;
    end_date: string;
    total_wagered: number;
    total_lost: number;
    status: 'pending' | 'claimed' | 'expired';
    claimed_at?: string;
}

interface UseVipRewardsReturn {
    pendingRewards: VipReward[];
    claimedRewards: VipReward[];
    loading: boolean;
    error: string | null;
    fetchRewards: () => Promise<void>;
    claimReward: (rewardId: string) => Promise<boolean>;
}

export function useVipRewards(): UseVipRewardsReturn {
    const { user } = useAuth();
    const [pendingRewards, setPendingRewards] = useState<VipReward[]>([]);
    const [claimedRewards, setClaimedRewards] = useState<VipReward[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRewards = useCallback(async () => {
        if (!user) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch pending rewards
            const { data: pending, error: pendingError } = await supabase
                .from('vip_reward_cycles')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (pendingError) throw pendingError;

            // Fetch claimed rewards (last 10)
            const { data: claimed, error: claimedError } = await supabase
                .from('vip_reward_cycles')
                .select('*')
                .eq('user_id', user.id)
                .eq('status', 'claimed')
                .order('claimed_at', { ascending: false })
                .limit(10);

            if (claimedError) throw claimedError;

            setPendingRewards(pending || []);
            setClaimedRewards(claimed || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rewards';
            setError(errorMessage);
            toast.error('Failed to load rewards', {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    }, [user]);

    const claimReward = useCallback(async (rewardId: string): Promise<boolean> => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('claim_vip_reward', { p_reward_id: rewardId });

            if (rpcError) {
                toast.error('Claim Failed', {
                    description: rpcError.message,
                });
                setError(rpcError.message);
                return false;
            }

            const result = data as {
                reward_id: string;
                amount: number;
                type: string;
                period: string;
                tier: string;
            };

            toast.success(`${result.period.charAt(0).toUpperCase() + result.period.slice(1)} ${result.type.charAt(0).toUpperCase() + result.type.slice(1)} Claimed!`, {
                description: `$${result.amount.toFixed(2)} has been added to your wallet.`,
            });

            // Refresh rewards list
            await fetchRewards();

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim reward';
            setError(errorMessage);
            toast.error('Claim Failed', {
                description: errorMessage,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, fetchRewards]);

    return {
        pendingRewards,
        claimedRewards,
        loading,
        error,
        fetchRewards,
        claimReward,
    };
}
