import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define base player counts for each game that sum to a realistic total
const BASE_PLAYER_COUNTS: Record<string, number> = {
    dice: 420,
    mines: 380,
    crash: 520,
    plinko: 290,
    coinflip: 85,
    blackjack: 210,
    'dragon-tower': 195,
    roulette: 150,
    slots: 280,
    poker: 170,
    // Add more games as needed
};

interface PlayerCountContextType {
    totalPlayers: number;
    getGamePlayers: (gameId: string) => number;
    gamePlayers: Record<string, number>;
}

const PlayerCountContext = createContext<PlayerCountContextType | undefined>(undefined);

export function PlayerCountProvider({ children }: { children: ReactNode }) {
    const [gamePlayers, setGamePlayers] = useState<Record<string, number>>(() => {
        // Initialize with base counts + small random offset
        const initial: Record<string, number> = {};
        Object.entries(BASE_PLAYER_COUNTS).forEach(([game, base]) => {
            initial[game] = base + Math.floor(Math.random() * 50) - 25;
        });
        return initial;
    });

    const [totalPlayers, setTotalPlayers] = useState(() => {
        return Object.values(gamePlayers).reduce((sum, count) => sum + count, 0);
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setGamePlayers(prev => {
                const updated: Record<string, number> = {};
                Object.entries(prev).forEach(([game, count]) => {
                    // Random fluctuation per game (-5 to +8)
                    const change = Math.floor(Math.random() * 14) - 5;
                    const base = BASE_PLAYER_COUNTS[game] || 100;
                    // Keep within ±30% of base
                    const min = Math.floor(base * 0.7);
                    const max = Math.floor(base * 1.3);
                    updated[game] = Math.max(min, Math.min(max, count + change));
                });
                return updated;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Update total whenever game counts change
    useEffect(() => {
        const total = Object.values(gamePlayers).reduce((sum, count) => sum + count, 0);
        setTotalPlayers(total);
    }, [gamePlayers]);

    const getGamePlayers = (gameId: string): number => {
        return gamePlayers[gameId] || Math.floor(Math.random() * 200) + 50;
    };

    return (
        <PlayerCountContext.Provider value={{ totalPlayers, getGamePlayers, gamePlayers }}>
            {children}
        </PlayerCountContext.Provider>
    );
}

export function usePlayerCount() {
    const context = useContext(PlayerCountContext);
    if (!context) {
        throw new Error('usePlayerCount must be used within PlayerCountProvider');
    }
    return context;
}
