/**
 * useDiceRoll Hook
 * 
 * Manages the dice game state and API calls including:
 * - Placing bets via Supabase RPC
 * - Seed management
 * - Bet history
 * - Real-time updates
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { toast } from 'sonner';
import {
    calculateMultiplier,
    calculateWinChance,
    generateClientSeed,
    type DiceBet,
    type DiceBetResult,
    type SeedInfo,
    type SeedRotationResult,
    DEFAULT_HOUSE_EDGE,
} from '@/lib/provablyFair';

interface UseDiceRollReturn {
    // State
    seeds: SeedInfo | null;
    betHistory: DiceBet[];
    isLoading: boolean;
    isRolling: boolean;
    lastResult: DiceBetResult | null;

    // Actions
    placeBet: (params: PlaceBetParams) => Promise<DiceBetResult | null>;
    rotateSeed: () => Promise<SeedRotationResult | null>;
    updateClientSeed: (seed: string) => Promise<boolean>;
    fetchSeeds: () => Promise<void>;
    fetchHistory: () => Promise<void>;

    // Computed
    houseEdge: number;
    getMultiplier: (winChance: number) => number;
}

interface PlaceBetParams {
    betAmount: number;
    target: number;
    condition: 'over' | 'under';
}

export const useDiceRoll = (): UseDiceRollReturn => {
    const { user } = useAuth();
    const { optimisticUpdate, refreshBalance } = useWallet();

    const [seeds, setSeeds] = useState<SeedInfo | null>(null);
    const [betHistory, setBetHistory] = useState<DiceBet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRolling, setIsRolling] = useState(false);
    const [lastResult, setLastResult] = useState<DiceBetResult | null>(null);

    const isInitialized = useRef(false);

    /**
     * Fetch current seeds
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
                .from('dice_bets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setBetHistory(data as DiceBet[]);
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
            .channel('dice_bets_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'dice_bets',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    setBetHistory(prev => [payload.new as DiceBet, ...prev].slice(0, 50));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    /**
     * Place a dice bet
     */
    const placeBet = useCallback(async (params: PlaceBetParams): Promise<DiceBetResult | null> => {
        if (!user) {
            toast.error('Please log in to play');
            return null;
        }

        const { betAmount, target, condition } = params;

        if (betAmount <= 0) {
            toast.error('Invalid bet amount');
            return null;
        }

        if (target < 1 || target > 98.99) {
            toast.error('Target must be between 1.00 and 98.99');
            return null;
        }

        setIsRolling(true);
        optimisticUpdate(-betAmount);

        try {
            const { data, error } = await supabase.rpc('place_dice_bet', {
                p_user_id: user.id,
                p_bet_amount: betAmount,
                p_target: target,
                p_roll_condition: condition,
                p_house_edge: DEFAULT_HOUSE_EDGE
            });

            if (error) throw error;

            const result = data as DiceBetResult;
            setLastResult(result);

            // Update seeds nonce
            setSeeds(prev => prev ? { ...prev, nonce: result.nonce + 1 } : prev);

            // Handle win/loss
            if (result.won) {
                optimisticUpdate(result.payout);
                toast.success(`Won! +${result.profit.toFixed(4)}`);
            } else {
                // Bet was already deducted
                toast.error(`Lost ${betAmount.toFixed(4)}`);
            }

            return result;
        } catch (e: any) {
            console.error('Bet failed:', e);
            optimisticUpdate(betAmount); // Revert
            toast.error(e.message || 'Failed to place bet');
            return null;
        } finally {
            setIsRolling(false);
        }
    }, [user, optimisticUpdate]);

    /**
     * Rotate server seed
     */
    const rotateSeed = useCallback(async (): Promise<SeedRotationResult | null> => {
        if (!user) {
            toast.error('Please log in');
            return null;
        }

        try {
            const { data, error } = await supabase.rpc('rotate_dice_seeds', {
                p_user_id: user.id
            });

            if (error) throw error;

            const result = data as SeedRotationResult;

            // Update seeds
            setSeeds({
                client_seed: result.client_seed,
                server_seed_hash: result.new_server_seed_hash,
                nonce: 0
            });

            // Refresh history to show revealed seeds
            fetchHistory();

            toast.success('Seeds rotated! Previous server seed revealed.');
            return result;
        } catch (e: any) {
            console.error('Seed rotation failed:', e);
            toast.error(e.message || 'Failed to rotate seeds');
            return null;
        }
    }, [user, fetchHistory]);

    /**
     * Update client seed
     */
    const updateClientSeed = useCallback(async (seed: string): Promise<boolean> => {
        if (!user) {
            toast.error('Please log in');
            return false;
        }

        if (!seed.trim()) {
            toast.error('Client seed cannot be empty');
            return false;
        }

        try {
            const { error } = await supabase.rpc('update_client_seed', {
                p_user_id: user.id,
                p_new_client_seed: seed.trim()
            });

            if (error) throw error;

            setSeeds(prev => prev ? { ...prev, client_seed: seed.trim() } : prev);
            toast.success('Client seed updated');
            return true;
        } catch (e: any) {
            console.error('Failed to update client seed:', e);
            toast.error(e.message || 'Failed to update client seed');
            return false;
        }
    }, [user]);

    /**
     * Get multiplier for win chance
     */
    const getMultiplier = useCallback((winChance: number): number => {
        return calculateMultiplier(winChance, DEFAULT_HOUSE_EDGE);
    }, []);

    return {
        seeds,
        betHistory,
        isLoading,
        isRolling,
        lastResult,
        placeBet,
        rotateSeed,
        updateClientSeed,
        fetchSeeds,
        fetchHistory,
        houseEdge: DEFAULT_HOUSE_EDGE,
        getMultiplier,
    };
};

export default useDiceRoll;
