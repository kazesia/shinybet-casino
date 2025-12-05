import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';
import { DiceGameEngine } from '@/lib/DiceGameEngine';

export interface DiceBet {
    id: string;
    wager: number;
    target: number;
    roll_result: number;
    multiplier: number;
    payout: number;
    won: boolean;
    created_at: string;
}

export interface DiceResult {
    bet_id: string;
    roll: number;
    target: number;
    multiplier: number;
    won: boolean;
    payout: number;
    balance: number;
    server_seed: string;
    nonce: number;
}

interface UseDiceGameReturn {
    playDice: (wager: number, target: number) => Promise<DiceResult | null>;
    history: DiceBet[];
    loading: boolean;
    playing: boolean;
    error: string | null;
    fetchHistory: () => Promise<void>;
}

export function useDiceGame(): UseDiceGameReturn {
    const { user } = useAuth();
    const { balance, refreshBalance } = useWallet();
    const [history, setHistory] = useState<DiceBet[]>([]);
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const { data, error: rpcError } = await supabase
                .rpc('get_dice_history', {
                    p_user_id: user.id,
                    p_limit: 50
                });

            if (rpcError) throw rpcError;

            setHistory(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
            setError(errorMessage);
            console.error('Dice history error:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const playDice = useCallback(async (wager: number, target: number): Promise<DiceResult | null> => {
        if (!user) {
            toast.error('Not authenticated', {
                description: 'Please log in to play.',
            });
            return null;
        }

        // Client-side validation
        if (!DiceGameEngine.isValidTarget(target)) {
            toast.error('Invalid target', {
                description: 'Target must be between 0.01 and 99.99',
            });
            return null;
        }

        if (!DiceGameEngine.isValidWager(wager, balance)) {
            toast.error('Invalid wager', {
                description: `Wager must be between $0.01 and $10,000 and not exceed your balance.`,
            });
            return null;
        }

        setPlaying(true);
        setError(null);

        try {
            // Generate client seed for provably fair
            const clientSeed = DiceGameEngine.generateClientSeed();

            const { data, error: rpcError } = await supabase
                .rpc('play_dice', {
                    p_user_id: user.id,
                    p_wager: wager,
                    p_target: target,
                    p_client_seed: clientSeed
                });

            if (rpcError) {
                // Handle specific error messages
                if (rpcError.message.includes('Insufficient balance')) {
                    toast.error('Insufficient Balance', {
                        description: 'You don\'t have enough credits to place this bet.',
                    });
                } else if (rpcError.message.includes('exceeds maximum')) {
                    toast.error('Bet Too Large', {
                        description: 'Maximum bet is $10,000.',
                    });
                } else {
                    toast.error('Bet Failed', {
                        description: rpcError.message,
                    });
                }
                setError(rpcError.message);
                return null;
            }

            const result = data as DiceResult;

            // Show result toast
            if (result.won) {
                toast.success('You Won!', {
                    description: `Roll: ${result.roll.toFixed(2)} < ${result.target.toFixed(2)} | Payout: $${result.payout.toFixed(2)}`,
                });
            } else {
                toast.error('You Lost', {
                    description: `Roll: ${result.roll.toFixed(2)} ≥ ${result.target.toFixed(2)}`,
                });
            }

            // Refresh balance and history
            await refreshBalance();
            await fetchHistory();

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to play dice';
            setError(errorMessage);
            toast.error('Game Error', {
                description: errorMessage,
            });
            return null;
        } finally {
            setPlaying(false);
        }
    }, [user, balance, refreshBalance, fetchHistory]);

    return {
        playDice,
        history,
        loading,
        playing,
        error,
        fetchHistory,
    };
}
