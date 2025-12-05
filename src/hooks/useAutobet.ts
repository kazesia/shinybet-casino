import { useState, useCallback, useRef } from 'react';

export interface AutobetConfig {
    numberOfBets: number; // -1 for infinite
    stopOnProfit: number | null;
    stopOnLoss: number | null;
    onWin: 'reset' | 'increase';
    onWinMultiplier: number;
    onLoss: 'reset' | 'increase';
    onLossMultiplier: number;
}

export interface AutobetState {
    isRunning: boolean;
    currentBet: number;
    totalBets: number;
    totalProfit: number;
    wins: number;
    losses: number;
}

const DEFAULT_CONFIG: AutobetConfig = {
    numberOfBets: 10,
    stopOnProfit: null,
    stopOnLoss: null,
    onWin: 'reset',
    onWinMultiplier: 1,
    onLoss: 'reset',
    onLossMultiplier: 1,
};

export function useAutobet(baseBetAmount: number) {
    const [config, setConfig] = useState<AutobetConfig>(DEFAULT_CONFIG);
    const [state, setState] = useState<AutobetState>({
        isRunning: false,
        currentBet: 0,
        totalBets: 0,
        totalProfit: 0,
        wins: 0,
        losses: 0,
    });

    const stopRef = useRef(false);
    const betAmountRef = useRef(baseBetAmount);

    const start = useCallback(() => {
        stopRef.current = false;
        betAmountRef.current = baseBetAmount;
        setState({
            isRunning: true,
            currentBet: 0,
            totalBets: 0,
            totalProfit: 0,
            wins: 0,
            losses: 0,
        });
    }, [baseBetAmount]);

    const stop = useCallback(() => {
        stopRef.current = true;
        setState(prev => ({ ...prev, isRunning: false }));
    }, []);

    const shouldStop = useCallback(() => {
        return stopRef.current;
    }, []);

    const processResult = useCallback((isWin: boolean, profit: number): { shouldContinue: boolean; nextBetAmount: number } => {
        const newTotalProfit = state.totalProfit + profit;
        const newTotalBets = state.totalBets + 1;
        const newWins = isWin ? state.wins + 1 : state.wins;
        const newLosses = !isWin ? state.losses + 1 : state.losses;

        // Update bet amount based on result
        let nextBetAmount = betAmountRef.current;
        if (isWin) {
            if (config.onWin === 'reset') {
                nextBetAmount = baseBetAmount;
            } else {
                nextBetAmount = betAmountRef.current * config.onWinMultiplier;
            }
        } else {
            if (config.onLoss === 'reset') {
                nextBetAmount = baseBetAmount;
            } else {
                nextBetAmount = betAmountRef.current * config.onLossMultiplier;
            }
        }
        betAmountRef.current = nextBetAmount;

        // Check stop conditions
        let shouldContinue = !stopRef.current;

        // Check number of bets
        if (config.numberOfBets !== -1 && newTotalBets >= config.numberOfBets) {
            shouldContinue = false;
        }

        // Check profit limit
        if (config.stopOnProfit !== null && newTotalProfit >= config.stopOnProfit) {
            shouldContinue = false;
        }

        // Check loss limit
        if (config.stopOnLoss !== null && newTotalProfit <= -config.stopOnLoss) {
            shouldContinue = false;
        }

        setState({
            isRunning: shouldContinue,
            currentBet: newTotalBets,
            totalBets: newTotalBets,
            totalProfit: newTotalProfit,
            wins: newWins,
            losses: newLosses,
        });

        return { shouldContinue, nextBetAmount };
    }, [state, config, baseBetAmount]);

    const updateConfig = useCallback((updates: Partial<AutobetConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    const resetStats = useCallback(() => {
        setState({
            isRunning: false,
            currentBet: 0,
            totalBets: 0,
            totalProfit: 0,
            wins: 0,
            losses: 0,
        });
        betAmountRef.current = baseBetAmount;
    }, [baseBetAmount]);

    return {
        config,
        state,
        start,
        stop,
        shouldStop,
        processResult,
        updateConfig,
        resetStats,
        currentBetAmount: betAmountRef.current,
    };
}

export default useAutobet;
