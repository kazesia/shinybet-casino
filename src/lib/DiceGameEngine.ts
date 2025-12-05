/**
 * Dice Game Engine
 * 
 * Utility functions for dice game calculations.
 * Note: Actual game logic runs server-side for security.
 * These are for UI display and validation only.
 */

export class DiceGameEngine {
    private static readonly DEFAULT_HOUSE_EDGE = 1.0;
    private static readonly MIN_TARGET = 0.01;
    private static readonly MAX_TARGET = 99.99;
    private static readonly MIN_MULTIPLIER = 1.0101;

    /**
     * Calculate multiplier based on target and house edge
     * Formula: (100 - houseEdge) / winChance
     */
    static calculateMultiplier(target: number, houseEdge: number = this.DEFAULT_HOUSE_EDGE): number {
        if (target < this.MIN_TARGET || target > this.MAX_TARGET) {
            throw new Error(`Target must be between ${this.MIN_TARGET} and ${this.MAX_TARGET}`);
        }

        const winChance = target;
        const multiplier = (100 - houseEdge) / winChance;
        return Math.floor(multiplier * 10000) / 10000; // 4 decimal places
    }

    /**
     * Calculate win chance from target
     */
    static calculateWinChance(target: number): number {
        return target;
    }

    /**
     * Calculate potential profit
     */
    static calculateProfit(wager: number, multiplier: number): number {
        return wager * multiplier - wager;
    }

    /**
     * Validate target value
     */
    static isValidTarget(target: number): boolean {
        return target >= this.MIN_TARGET && target <= this.MAX_TARGET;
    }

    /**
     * Validate wager amount
     */
    static isValidWager(wager: number, balance: number, minBet: number = 0.01, maxBet: number = 10000): boolean {
        return wager >= minBet && wager <= maxBet && wager <= balance;
    }

    /**
     * Generate client seed for provably fair
     */
    static generateClientSeed(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate server seed (32 bytes hex)
     */
    static generateServerSeed(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hash server seed using SHA256
     */
    static async hashServerSeed(serverSeed: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(serverSeed);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate provably fair roll from seeds
     * Formula: SHA256(clientSeed + serverSeed + nonce) -> first 8 hex chars -> normalize to 0-99.99
     */
    static async generateRollFromSeeds(
        clientSeed: string,
        serverSeed: string,
        nonce: number
    ): Promise<number> {
        const combined = `${clientSeed}${serverSeed}${nonce}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Take first 8 hex characters
        const hex8 = hashHex.slice(0, 8);

        // Convert to integer
        const intValue = parseInt(hex8, 16);

        // Normalize to 0-1
        const normalized = intValue / 0xffffffff;

        // Scale to 0-99.99
        const roll = Math.floor(normalized * 10000) / 100;

        return Math.min(99.99, Math.max(0, roll));
    }

    /**
     * Verify a dice roll using seeds and nonce
     */
    static async verifyRoll(
        clientSeed: string,
        serverSeed: string,
        nonce: number,
        expectedRoll: number
    ): Promise<boolean> {
        const calculatedRoll = await this.generateRollFromSeeds(clientSeed, serverSeed, nonce);
        // Allow small floating point difference
        return Math.abs(calculatedRoll - expectedRoll) < 0.01;
    }

    /**
     * Format roll result for display
     */
    static formatRoll(roll: number): string {
        return roll.toFixed(2);
    }

    /**
     * Determine if roll is a win
     */
    static isWin(roll: number, target: number): boolean {
        return roll < target;
    }
}
