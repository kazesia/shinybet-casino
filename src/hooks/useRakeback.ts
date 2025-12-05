import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RakebackData {
    amount_usd: number;
    period_start: string;
    period_end: string;
    breakdown: Array<{
        currency: string;
        amount: number;
    }>;
    bet_count: number;
    rakeback_rate: number;
}

interface UseRakebackReturn {
    rakebackData: RakebackData | null;
    loading: boolean;
    error: string | null;
    calculateRakeback: () => Promise<void>;
    claimRakeback: () => Promise<boolean>;
    resetError: () => void;
}

export function useRakeback(): UseRakebackReturn {
    const { user } = useAuth();
    const [rakebackData, setRakebackData] = useState<RakebackData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetError = useCallback(() => {
        setError(null);
    }, []);

    const calculateRakeback = useCallback(async () => {
        if (!user) {
            setError('User not authenticated');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('calculate_rakeback', { p_user_id: user.id });

            if (rpcError) {
                // Handle specific error messages
                if (rpcError.message.includes('already claimed')) {
                    setError('You have already claimed rakeback in the last 12 hours. Please try again later.');
                } else {
                    setError(rpcError.message);
                }
                setRakebackData(null);
                return;
            }

            setRakebackData(data as RakebackData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to calculate rakeback';
            setError(errorMessage);
            setRakebackData(null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const claimRakeback = useCallback(async (): Promise<boolean> => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        if (!rakebackData || rakebackData.amount_usd <= 0) {
            setError('No rakeback available to claim');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('claim_rakeback', { p_user_id: user.id });

            if (rpcError) {
                // Handle specific error messages
                if (rpcError.message.includes('already claimed')) {
                    setError('You have already claimed rakeback in the last 12 hours.');
                    toast.error('Already Claimed', {
                        description: 'You have already claimed rakeback in the last 12 hours.',
                    });
                } else if (rpcError.message.includes('No rakeback available')) {
                    setError('No rakeback available to claim. Place more bets to earn rakeback.');
                    toast.error('No Rakeback Available', {
                        description: 'Place more bets to earn rakeback.',
                    });
                } else {
                    setError(rpcError.message);
                    toast.error('Claim Failed', {
                        description: rpcError.message,
                    });
                }
                return false;
            }

            // Success
            setRakebackData(data as RakebackData);
            toast.success(`Successfully claimed $${(data as RakebackData).amount_usd.toFixed(2)} rakeback!`, {
                description: 'Your rakeback has been added to your wallet.',
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim rakeback';
            setError(errorMessage);
            toast.error('Claim Failed', {
                description: errorMessage,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user, rakebackData]);

    return {
        rakebackData,
        loading,
        error,
        calculateRakeback,
        claimRakeback,
        resetError,
    };
}
