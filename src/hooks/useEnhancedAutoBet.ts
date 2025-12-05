import { useState, useCallback, useRef } from 'react';
import { useDiceGame, type DiceResult } from './useDiceGame';
import { toast } from 'sonner';

export interface AutoBetSettings {
    baseBet: number;
    target: number;
    numberOfBets: number;
    onWinAction: 'reset' | 'increase';
    onWinMultiplier: number;
    onLossAction: 'reset' | 'increase';
    onLossMultiplier: number;
    stopOnProfit: number;
    stopOnLoss: number;
}

export interface BetHistoryItem {
    betNumber: number;
    wager: number;
    roll: number;
    target: number;
    won: boolean;
    payout: number;
    profit: number;
    cumulativeProfit: number;
    timestamp: number;
}

export interface AutoBetStats {
    betsPlaced: number;
    totalWagered: number;
    totalProfit: number;
    wins: number;
    losses: number;
    currentStreak: number;
    longestWinStreak: number;
    longestLossStreak: number;
    winRate: number;
    averageWager: number;
    biggestWin: number;
    biggestLoss: number;
    history: BetHistoryItem[];
}

interface UseEnhancedAutoBetReturn {
    running: boolean;
    paused: boolean;
    stats: AutoBetStats;
    currentBet: number;
    startAutoBet: (settings: AutoBetSettings) => Promise<void>;
    pauseAutoBet: () => void;
    resumeAutoBet: () => void;
    stopAutoBet: () => void;
    resetStats: () => void;
}

export function useEnhancedAutoBet(): UseEnhancedAutoBetReturn {
    const { playDice } = useDiceGame();
    const [running, setRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [currentBet, setCurrentBet] = useState(0);
    const [stats, setStats] = useState<AutoBetStats>({
        betsPlaced: 0,
        totalWagered: 0,
        totalProfit: 0,
        wins: 0,
        losses: 0,
        currentStreak: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        winRate: 0,
        averageWager: 0,
        biggestWin: 0,
        biggestLoss: 0,
        history: [],
    });

    const stopRequested = useRef(false);
    const pauseRequested = useRef(false);

    const resetStats = useCallback(() => {
        setStats({
            betsPlaced: 0,
            totalWagered: 0,
            totalProfit: 0,
            wins: 0,
            losses: 0,
            currentStreak: 0,
            longestWinStreak: 0,
            longestLossStreak: 0,
            winRate: 0,
            averageWager: 0,
            biggestWin: 0,
            biggestLoss: 0,
            history: [],
        });
    }, []);

    const updateStats = useCallback((result: DiceResult, wager: number, betNumber: number) => {
        setStats(prev => {
            const profit = result.won ? result.payout - wager : -wager;
            const newTotalProfit = prev.totalProfit + profit;
            const newTotalWagered = prev.totalWagered + wager;
            const newWins = prev.wins + (result.won ? 1 : 0);
            const newLosses = prev.losses + (result.won ? 0 : 1);
            const newBetsPlaced = prev.betsPlaced + 1;

            let newCurrentStreak = result.won ?
                (prev.currentStreak > 0 ? prev.currentStreak + 1 : 1) :
                (prev.currentStreak < 0 ? prev.currentStreak - 1 : -1);

            const newLongestWinStreak = result.won && newCurrentStreak > prev.longestWinStreak ?
                newCurrentStreak : prev.longestWinStreak;

            const newLongestLossStreak = !result.won && Math.abs(newCurrentStreak) > prev.longestLossStreak ?
                Math.abs(newCurrentStreak) : prev.longestLossStreak;

            const newWinRate = newBetsPlaced > 0 ? (newWins / newBetsPlaced) * 100 : 0;
            const newAverageWager = newTotalWagered / newBetsPlaced;
            const newBiggestWin = result.won && profit > prev.biggestWin ? profit : prev.biggestWin;
            const newBiggestLoss = !result.won && Math.abs(profit) > prev.biggestLoss ? Math.abs(profit) : prev.biggestLoss;

            const historyItem: BetHistoryItem = {
                betNumber,
                wager,
                roll: result.roll,
                target: result.target,
                won: result.won,
                payout: result.payout,
                profit,
                cumulativeProfit: newTotalProfit,
                timestamp: Date.now(),
            };

            const newHistory = [...prev.history, historyItem].slice(-100);

            return {
                betsPlaced: newBetsPlaced,
                totalWagered: newTotalWagered,
                totalProfit: newTotalProfit,
                wins: newWins,
                losses: newLosses,
                currentStreak: newCurrentStreak,
                longestWinStreak: newLongestWinStreak,
                longestLossStreak: newLongestLossStreak,
                winRate: newWinRate,
                averageWager: newAverageWager,
                biggestWin: newBiggestWin,
                biggestLoss: newBiggestLoss,
                history: newHistory,
            };
        });
    }, []);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const startAutoBet = useCallback(async (settings: AutoBetSettings) => {
        if (running) {
            toast.error('Auto-bet already running');
            return;
        }

        if (settings.baseBet <= 0) {
            toast.error('Invalid base bet');
            return;
        }

        if (settings.numberOfBets <= 0 || settings.numberOfBets > 100) {
            toast.error('Invalid number of bets');
            return;
        }

        setRunning(true);
        setPaused(false);
        stopRequested.current = false;
        pauseRequested.current = false;
        resetStats();

        let currentWager = settings.baseBet;
        setCurrentBet(currentWager);

        for (let i = 0; i < settings.numberOfBets; i++) {
            if (stopRequested.current) break;

            while (pauseRequested.current && !stopRequested.current) {
                await delay(100);
            }

            if (stopRequested.current) break;

            try {
                const result = await playDice(currentWager, settings.target);

                if (!result) break;

                updateStats(result, currentWager, i + 1);

                if (result.won) {
                    currentWager = settings.onWinAction === 'reset' ? settings.baseBet : currentWager * settings.onWinMultiplier;
                } else {
                    currentWager = settings.onLossAction === 'reset' ? settings.baseBet : currentWager * settings.onLossMultiplier;
                }

                if (currentWager > 10000) currentWager = 10000;
                setCurrentBet(currentWager);

                await delay(300);
            } catch (error) {
                console.error('Auto-bet error:', error);
                break;
            }
        }

        setRunning(false);
        setPaused(false);
        setCurrentBet(0);
    }, [running, playDice, updateStats, resetStats]);

    const pauseAutoBet = useCallback(() => {
        if (!running || paused) return;
        pauseRequested.current = true;
        setPaused(true);
    }, [running, paused]);

    const resumeAutoBet = useCallback(() => {
        if (!running || !paused) return;
        pauseRequested.current = false;
        setPaused(false);
    }, [running, paused]);

    const stopAutoBet = useCallback(() => {
        if (!running) return;
        stopRequested.current = true;
        pauseRequested.current = false;
        setPaused(false);
    }, [running]);

    return {
        running,
        paused,
        stats,
        currentBet,
        startAutoBet,
        pauseAutoBet,
        resumeAutoBet,
        stopAutoBet,
        resetStats,
    };
}
