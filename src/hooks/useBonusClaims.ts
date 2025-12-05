import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface BonusClaimResult {
    amount: number;
    next_claim: string;
}

interface UseBonusClaimsReturn {
    claimWeeklyBoost: () => Promise<boolean>;
    claimMonthlyBonus: () => Promise<boolean>;
    claimPlatinumReload: () => Promise<boolean>;
    loading: boolean;
    error: string | null;
}

export function useBonusClaims(): UseBonusClaimsReturn {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const claimWeeklyBoost = useCallback(async (): Promise<boolean> => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('claim_weekly_boost', { p_user_id: user.id });

            if (rpcError) {
                // Extract hours from error message if available
                const hoursMatch = rpcError.message.match(/(\d+\.?\d*)\s*hours/);
                const hours = hoursMatch ? parseFloat(hoursMatch[1]) : null;

                if (hours) {
                    const hoursText = hours < 1
                        ? `${Math.round(hours * 60)} minutes`
                        : `${Math.round(hours)} hours`;

                    toast.error('Weekly Boost Already Claimed', {
                        description: `Next claim available in ${hoursText}.`,
                    });
                } else {
                    toast.error('Claim Failed', {
                        description: rpcError.message,
                    });
                }
                setError(rpcError.message);
                return false;
            }

            const result = data as BonusClaimResult;
            toast.success('Weekly Boost Claimed!', {
                description: `$${result.amount.toFixed(2)} has been added to your wallet.`,
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim weekly boost';
            setError(errorMessage);
            toast.error('Claim Failed', {
                description: errorMessage,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const claimMonthlyBonus = useCallback(async (): Promise<boolean> => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('claim_monthly_bonus', { p_user_id: user.id });

            if (rpcError) {
                // Extract days from error message if available
                const daysMatch = rpcError.message.match(/(\d+\.?\d*)\s*days/);
                const days = daysMatch ? parseFloat(daysMatch[1]) : null;

                if (days) {
                    const daysText = days < 1
                        ? `${Math.round(days * 24)} hours`
                        : `${Math.round(days)} days`;

                    toast.error('Monthly Bonus Already Claimed', {
                        description: `Next claim available in ${daysText}.`,
                    });
                } else {
                    toast.error('Claim Failed', {
                        description: rpcError.message,
                    });
                }
                setError(rpcError.message);
                return false;
            }

            const result = data as BonusClaimResult;
            toast.success('Monthly Bonus Claimed!', {
                description: `$${result.amount.toFixed(2)} has been added to your wallet.`,
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim monthly bonus';
            setError(errorMessage);
            toast.error('Claim Failed', {
                description: errorMessage,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    const claimPlatinumReload = useCallback(async (): Promise<boolean> => {
        if (!user) {
            setError('User not authenticated');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('claim_platinum_reload', { p_user_id: user.id });

            if (rpcError) {
                // Check for tier requirement error
                if (rpcError.message.includes('requires Platinum')) {
                    toast.error('Tier Requirement Not Met', {
                        description: 'Platinum Reload requires Platinum or Diamond VIP tier.',
                    });
                } else {
                    // Extract hours from cooldown error
                    const hoursMatch = rpcError.message.match(/(\d+\.?\d*)\s*hours/);
                    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : null;

                    if (hours) {
                        const hoursText = hours < 1
                            ? `${Math.round(hours * 60)} minutes`
                            : `${Math.round(hours)} hours`;

                        toast.error('Platinum Reload Already Claimed', {
                            description: `Next claim available in ${hoursText}.`,
                        });
                    } else {
                        toast.error('Claim Failed', {
                            description: rpcError.message,
                        });
                    }
                }
                setError(rpcError.message);
                return false;
            }

            const result = data as BonusClaimResult;
            toast.success('Platinum Reload Claimed!', {
                description: `$${result.amount.toFixed(2)} has been added to your wallet.`,
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to claim platinum reload';
            setError(errorMessage);
            toast.error('Claim Failed', {
                description: errorMessage,
            });
            return false;
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        claimWeeklyBoost,
        claimMonthlyBonus,
        claimPlatinumReload,
        loading,
        error,
    };
}
