/**
 * Provably Fair Library
 * 
 * Client-side utilities for the provably fair dice game.
 * These functions allow users to independently verify game results.
 * 
 * Algorithm:
 * 1. fullSeed = clientSeed + ":" + serverSeed + ":" + nonce
 * 2. hash = SHA256(fullSeed)
 * 3. hex = first 8 characters of hash
 * 4. decimal = parseInt(hex, 16) / 0xFFFFFFFF
 * 5. roll = round(decimal * 10000) / 100  → 0.00 to 99.99
 */

// House edge configuration
export const DEFAULT_HOUSE_EDGE = 1.0; // 1%

/**
 * Generate SHA-256 hash of input string
 */
export const sha256 = async (input: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Generate a random hex string for client seed
 */
export const generateClientSeed = (bytes: number = 8): string => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Calculate dice roll from seeds and nonce
 * This replicates the server-side algorithm for verification
 * 
 * @param clientSeed - User's client seed
 * @param serverSeed - Revealed server seed
 * @param nonce - Bet number
 * @returns Roll result from 0.00 to 99.99
 */
export const calculateDiceRoll = async (
    clientSeed: string,
    serverSeed: string,
    nonce: number
): Promise<number> => {
    // Combine seeds: clientSeed:serverSeed:nonce
    const fullSeed = `${clientSeed}:${serverSeed}:${nonce}`;

    // Generate SHA-256 hash
    const hash = await sha256(fullSeed);

    // Take first 8 hex characters
    const hex = hash.substring(0, 8);

    // Convert to decimal (0 to 4294967295)
    const decimal = parseInt(hex, 16);

    // Convert to 0.00-99.99 range
    const result = Math.round((decimal / 0xFFFFFFFF) * 10000) / 100;

    // Clamp to valid range
    return Math.max(0, Math.min(99.99, result));
};

/**
 * Verify a dice bet result
 * 
 * @param bet - The bet to verify
 * @returns Whether the result is verified
 */
export const verifyDiceResult = async (
    clientSeed: string,
    serverSeed: string,
    nonce: number,
    expectedResult: number
): Promise<boolean> => {
    const calculatedResult = await calculateDiceRoll(clientSeed, serverSeed, nonce);
    // Allow for small floating point differences
    return Math.abs(calculatedResult - expectedResult) < 0.01;
};

/**
 * Calculate win chance based on target and condition
 */
export const calculateWinChance = (
    target: number,
    condition: 'over' | 'under'
): number => {
    if (condition === 'under') {
        return target;
    } else {
        return 100 - target;
    }
};

/**
 * Calculate multiplier with house edge
 * Formula: (100 - houseEdge) / winChance
 */
export const calculateMultiplier = (
    winChance: number,
    houseEdge: number = DEFAULT_HOUSE_EDGE
): number => {
    const clampedChance = Math.max(0.01, Math.min(98.99, winChance));
    return (100 - houseEdge) / clampedChance;
};

/**
 * Calculate target from multiplier
 */
export const calculateTargetFromMultiplier = (
    multiplier: number,
    condition: 'over' | 'under',
    houseEdge: number = DEFAULT_HOUSE_EDGE
): number => {
    const winChance = (100 - houseEdge) / multiplier;
    if (condition === 'under') {
        return winChance;
    } else {
        return 100 - winChance;
    }
};

/**
 * Calculate expected value for a bet
 * EV = (winChance * profit) - (loseChance * betAmount)
 */
export const calculateExpectedValue = (
    betAmount: number,
    winChance: number,
    multiplier: number
): number => {
    const winProb = winChance / 100;
    const loseProb = 1 - winProb;
    const profit = betAmount * multiplier - betAmount;
    return (winProb * profit) - (loseProb * betAmount);
};

/**
 * Determine if a roll is a win
 */
export const isWinningRoll = (
    roll: number,
    target: number,
    condition: 'over' | 'under'
): boolean => {
    if (condition === 'under') {
        return roll < target;
    } else {
        return roll > target;
    }
};

/**
 * Format a number to specified decimal places
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
};

/**
 * Truncate a hash for display
 */
export const truncateHash = (hash: string, chars: number = 8): string => {
    if (!hash) return '';
    if (hash.length <= chars * 2) return hash;
    return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
};

/**
 * Interface for a dice bet record
 */
export interface DiceBet {
    id: string;
    user_id: string;
    bet_amount: number;
    currency: string;
    target: number;
    roll_condition: 'over' | 'under';
    multiplier: number;
    win_chance: number;
    house_edge: number;
    roll_result: number;
    won: boolean;
    payout: number;
    profit: number;
    client_seed: string;
    server_seed_hash: string;
    server_seed?: string;
    nonce: number;
    verified?: boolean;
    is_public: boolean;
    created_at: string;
}

/**
 * Interface for seed info
 */
export interface SeedInfo {
    client_seed: string;
    server_seed_hash: string;
    nonce: number;
}

/**
 * Interface for seed history
 */
export interface SeedHistory {
    id: string;
    client_seed: string;
    server_seed: string;
    server_seed_hash: string;
    start_nonce: number;
    end_nonce: number;
    created_at: string;
    revealed_at: string;
}

/**
 * Interface for bet result from RPC
 */
export interface DiceBetResult {
    bet_id: string;
    roll: number;
    won: boolean;
    payout: number;
    profit: number;
    multiplier: number;
    target: number;
    condition: 'over' | 'under';
    nonce: number;
    server_seed_hash: string;
}

/**
 * Interface for seed rotation result
 */
export interface SeedRotationResult {
    revealed_server_seed: string;
    revealed_hash: string;
    bets_updated: number;
    new_server_seed_hash: string;
    client_seed: string;
}

// =====================================================
// PLINKO PROVABLY FAIR FUNCTIONS
// =====================================================

/**
 * Calculate Plinko path bit for a single row
 * Uses same SHA-256 algorithm as dice but with row index
 */
export const calculatePlinkoRowBit = async (
    clientSeed: string,
    serverSeed: string,
    nonce: number,
    rowIndex: number
): Promise<0 | 1> => {
    // Combine seeds with row index: clientSeed:serverSeed:nonce:rowIndex
    const fullSeed = `${clientSeed}:${serverSeed}:${nonce}:${rowIndex}`;

    // Generate SHA-256 hash
    const hash = await sha256(fullSeed);

    // Take first 2 hex characters and convert to 0 or 1
    const byte = parseInt(hash.substring(0, 2), 16);
    return (byte % 2) as 0 | 1;
};

/**
 * Calculate complete Plinko path from seeds
 * Returns string of 0s and 1s representing left/right at each row
 */
export const calculatePlinkoPath = async (
    clientSeed: string,
    serverSeed: string,
    nonce: number,
    rows: number
): Promise<{ pathBits: string; endPosition: number }> => {
    let pathBits = '';
    let endPosition = 0;

    for (let i = 0; i < rows; i++) {
        const bit = await calculatePlinkoRowBit(clientSeed, serverSeed, nonce, i);
        pathBits += bit.toString();
        endPosition += bit;
    }

    return { pathBits, endPosition };
};

/**
 * Verify a Plinko bet result
 */
export const verifyPlinkoResult = async (
    clientSeed: string,
    serverSeed: string,
    nonce: number,
    rows: number,
    expectedPathBits: string,
    expectedEndPosition: number
): Promise<{ verified: boolean; calculatedPath: string; calculatedPosition: number }> => {
    const { pathBits, endPosition } = await calculatePlinkoPath(
        clientSeed,
        serverSeed,
        nonce,
        rows
    );

    const verified = pathBits === expectedPathBits && endPosition === expectedEndPosition;

    return {
        verified,
        calculatedPath: pathBits,
        calculatedPosition: endPosition,
    };
};

/**
 * Interface for Plinko bet record
 */
export interface PlinkoBet {
    id: string;
    user_id: string;
    bet_amount: number;
    currency: string;
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
    is_public: boolean;
    created_at: string;
    verified?: boolean;
}

/**
 * Interface for Plinko bet result from RPC
 */
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

