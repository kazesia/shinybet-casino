/**
 * usePlinko Hook
 * 
 * Manages Plinko game state and API calls including:
 * - Placing bets via Supabase RPC
 * - Seed management (shared with Dice)
 * - Bet history
 * - Real-time updates
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';
import { type SeedInfo } from '@/lib/provablyFair';

export interface PlinkoBet {
    id: string;
    user_id: string;
    bet_amount: number;
    risk_level: 'low' | 'medium' | 'high';
    row_count: number;
    path_bits: string;
    end_position: number;
    multiplier: number;
    payout: number;
    profit: number;
    won: boolean;
    client_seed: string;
    server_seed_hash: string;
    server_seed?: string;
    nonce: number;
    created_at: string;
}

export interface PlinkoBetResult {
    bet_id: string;
    path_bits: string;
    end_position: number;
    multiplier: number;
    payout: number;
    profit: number;
    won: boolean;
    nonce: number;
    server_seed_hash: string;
}

interface UsePlinkoReturn {
    // State
    seeds: SeedInfo | null;
    betHistory: PlinkoBet[];
    isLoading: boolean;
    isDropping: boolean;
    lastResult: PlinkoBetResult | null;

    // Actions
    dropBall: (params: DropBallParams) => Promise<PlinkoBetResult | null>;
    fetchSeeds: () => Promise<void>;
    fetchHistory: () => Promise<void>;
}

interface DropBallParams {
    betAmount: number;
    risk: 'low' | 'medium' | 'high';
    rows: number;
}

export const usePlinko = (): UsePlinkoReturn => {
    const { user } = useAuth();
    const { optimisticUpdate, refreshBalance } = useWallet();

    const [seeds, setSeeds] = useState<SeedInfo | null>(null);
    const [betHistory, setBetHistory] = useState<PlinkoBet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDropping, setIsDropping] = useState(false);
    const [lastResult, setLastResult] = useState<PlinkoBetResult | null>(null);

    const isInitialized = useRef(false);

    /**
     * Fetch current seeds (reuses dice_seeds via get_user_dice_seeds)
     */
    const fetchSeeds = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase.rpc('get_user_dice_seeds', {
                p_user_id: user.id
            });

            if (error) throw error;
            setSeeds(data as SeedInfo);
        } catch (e: any) {
            console.error('Failed to fetch seeds:', e);
        }
    }, [user]);

    /**
     * Fetch bet history
     */
    const fetchHistory = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('plinko_bets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setBetHistory(data as PlinkoBet[]);
        } catch (e: any) {
            console.error('Failed to fetch history:', e);
        }
    }, [user]);

    /**
     * Initialize on mount
     */
    useEffect(() => {
        if (!user || isInitialized.current) return;
        isInitialized.current = true;

        const init = async () => {
            setIsLoading(true);
            await Promise.all([fetchSeeds(), fetchHistory()]);
            setIsLoading(false);
        };

        init();
    }, [user, fetchSeeds, fetchHistory]);

    /**
     * Subscribe to real-time bet updates
     */
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel('plinko_bets_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'plinko_bets',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setBetHistory(prev => [payload.new as PlinkoBet, ...prev].slice(0, 50));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    /**
     * Drop a ball (place a bet)
     */
    const dropBall = useCallback(async (params: DropBallParams): Promise<PlinkoBetResult | null> => {
        if (!user) {
            toast.error('Please log in to play');
            return null;
        }

        const { betAmount, risk, rows } = params;

        if (betAmount <= 0) {
            toast.error('Invalid bet amount');
            return null;
        }

        if (!['low', 'medium', 'high'].includes(risk)) {
            toast.error('Invalid risk level');
            return null;
        }

        if (![8, 12, 16].includes(rows)) {
            toast.error('Invalid row count');
            return null;
        }

        setIsDropping(true);
        optimisticUpdate(-betAmount);

        try {
            const { data, error } = await supabase.rpc('place_plinko_bet', {
                p_user_id: user.id,
                p_bet_amount: betAmount,
                p_risk: risk,
                p_rows: rows
            });

            if (error) throw error;

            const result = data as PlinkoBetResult;
            setLastResult(result);

            // Update seeds nonce
            setSeeds(prev => prev ? { ...prev, nonce: result.nonce + 1 } : prev);

            // Handle win/loss feedback
            if (result.won) {
                optimisticUpdate(result.payout);
                if (result.multiplier >= 2) {
                    toast.success(`${result.multiplier}x Win! +${result.profit.toFixed(4)}`);
                }
            }

            return result;
        } catch (e: any) {
            console.error('Bet failed:', e);
            optimisticUpdate(betAmount); // Revert
            toast.error(e.message || 'Failed to place bet');
            return null;
        } finally {
            setIsDropping(false);
        }
    }, [user, optimisticUpdate]);

    return {
        seeds,
        betHistory,
        isLoading,
        isDropping,
        lastResult,
        dropBall,
        fetchSeeds,
        fetchHistory,
    };
};

export default usePlinko;
