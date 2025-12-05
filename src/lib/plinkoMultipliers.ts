/**
 * Plinko Multiplier Generator
 * 
 * Uses Pascal's Triangle binomial distribution to generate mathematically
 * accurate multipliers for any row count (8-16) with proper RTP per risk tier.
 */

// =====================================================
// CORE MATH UTILITIES
// =====================================================

/**
 * Calculate binomial coefficient C(n, k) = n! / (k! * (n-k)!)
 */
export const binomial = (n: number, k: number): number => {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;

    let result = 1;
    for (let i = 0; i < k; i++) {
        result = result * (n - i) / (i + 1);
    }
    return Math.round(result);
};

/**
 * Calculate probability of landing in slot k for N rows
 * P_k = binomial(N, k) / 2^N
 */
export const slotProbability = (rows: number, slot: number): number => {
    return binomial(rows, slot) / Math.pow(2, rows);
};

/**
 * Get all slot probabilities for N rows
 */
export const getAllProbabilities = (rows: number): number[] => {
    const probs: number[] = [];
    for (let k = 0; k <= rows; k++) {
        probs.push(slotProbability(rows, k));
    }
    return probs;
};

// =====================================================
// RISK TIER CONFIGURATIONS
// =====================================================

interface RiskConfig {
    targetRTP: number;           // Target return to player (0.95-0.99)
    centerMultiplier: number;    // Multiplier for center slot(s)
    edgeMultiplier: number;      // Maximum multiplier for edge slots
    curveSteepness: number;      // How quickly multipliers increase toward edges
    minMultiplier: number;       // Minimum multiplier (0 for high risk)
}

const RISK_CONFIGS: Record<'low' | 'medium' | 'high', RiskConfig> = {
    low: {
        targetRTP: 0.99,
        centerMultiplier: 1.0,
        edgeMultiplier: 16,
        curveSteepness: 1.5,
        minMultiplier: 0.5,
    },
    medium: {
        targetRTP: 0.98,
        centerMultiplier: 0.4,
        edgeMultiplier: 110,
        curveSteepness: 2.5,
        minMultiplier: 0.2,
    },
    high: {
        targetRTP: 0.96,
        centerMultiplier: 0.2,
        edgeMultiplier: 1000,
        curveSteepness: 4.0,
        minMultiplier: 0,
    },
};

// =====================================================
// MULTIPLIER GENERATION
// =====================================================

/**
 * Generate multipliers using exponential curve from center to edges
 * Higher risk = steeper curve = more extreme edge payouts
 */
const generateRawMultipliers = (
    rows: number,
    config: RiskConfig
): number[] => {
    const slots = rows + 1;
    const center = rows / 2;
    const multipliers: number[] = [];

    for (let k = 0; k <= rows; k++) {
        // Distance from center (0 at center, 1 at edges)
        const distanceFromCenter = Math.abs(k - center) / center;

        // Exponential curve from center to edge
        const curveValue = Math.pow(distanceFromCenter, config.curveSteepness);

        // Interpolate between center and edge multiplier
        const rawMult = config.centerMultiplier +
            (config.edgeMultiplier - config.centerMultiplier) * curveValue;

        // Apply minimum
        multipliers.push(Math.max(config.minMultiplier, rawMult));
    }

    return multipliers;
};

/**
 * Scale multipliers to achieve target RTP
 */
const scaleToTargetRTP = (
    multipliers: number[],
    probabilities: number[],
    targetRTP: number
): number[] => {
    // Calculate current expected value
    const currentEV = multipliers.reduce(
        (sum, mult, i) => sum + mult * probabilities[i],
        0
    );

    // Scale factor to achieve target RTP
    const scaleFactor = targetRTP / currentEV;

    return multipliers.map(mult => mult * scaleFactor);
};

/**
 * Make multipliers symmetrical (mirror left/right)
 */
const makeSymmetrical = (multipliers: number[]): number[] => {
    const result = [...multipliers];
    const center = Math.floor(multipliers.length / 2);

    for (let i = 0; i < center; i++) {
        const mirrorIndex = multipliers.length - 1 - i;
        const avg = (result[i] + result[mirrorIndex]) / 2;
        result[i] = avg;
        result[mirrorIndex] = avg;
    }

    return result;
};

/**
 * Round multipliers to nice display values
 */
const roundMultipliers = (multipliers: number[]): number[] => {
    return multipliers.map(mult => {
        if (mult >= 100) return Math.round(mult);
        if (mult >= 10) return Math.round(mult * 10) / 10;
        if (mult >= 1) return Math.round(mult * 100) / 100;
        return Math.round(mult * 100) / 100;
    });
};

// =====================================================
// MAIN GENERATOR FUNCTION
// =====================================================

/**
 * Generate Plinko multipliers for given rows and risk level
 * 
 * @param rows - Number of rows (8-16)
 * @param risk - Risk level ('low' | 'medium' | 'high')
 * @returns Symmetrical array of multipliers with length rows + 1
 */
export const generatePlinkoMultipliers = (
    rows: number,
    risk: 'low' | 'medium' | 'high'
): number[] => {
    if (rows < 8 || rows > 16) {
        throw new Error('Rows must be between 8 and 16');
    }

    const config = RISK_CONFIGS[risk];
    const probabilities = getAllProbabilities(rows);

    // Generate raw multipliers based on curve
    let multipliers = generateRawMultipliers(rows, config);

    // Make symmetrical
    multipliers = makeSymmetrical(multipliers);

    // Scale to target RTP
    multipliers = scaleToTargetRTP(multipliers, probabilities, config.targetRTP);

    // Round to nice values
    multipliers = roundMultipliers(multipliers);

    // Final symmetry pass after rounding
    multipliers = makeSymmetrical(multipliers);

    return multipliers;
};

// =====================================================
// VALIDATION & TESTING
// =====================================================

/**
 * Calculate actual RTP for given multipliers
 */
export const calculateRTP = (rows: number, multipliers: number[]): number => {
    const probabilities = getAllProbabilities(rows);
    return multipliers.reduce(
        (sum, mult, i) => sum + mult * probabilities[i],
        0
    );
};

/**
 * Validate multipliers meet requirements
 */
export const validateMultipliers = (
    rows: number,
    risk: 'low' | 'medium' | 'high',
    multipliers: number[]
): { valid: boolean; errors: string[]; rtp: number } => {
    const errors: string[] = [];

    // Check length
    if (multipliers.length !== rows + 1) {
        errors.push(`Expected ${rows + 1} multipliers, got ${multipliers.length}`);
    }

    // Check symmetry
    for (let i = 0; i < Math.floor(multipliers.length / 2); i++) {
        const mirrorIndex = multipliers.length - 1 - i;
        if (multipliers[i] !== multipliers[mirrorIndex]) {
            errors.push(`Asymmetric at index ${i}: ${multipliers[i]} vs ${multipliers[mirrorIndex]}`);
        }
    }

    // Check RTP
    const rtp = calculateRTP(rows, multipliers);
    const config = RISK_CONFIGS[risk];
    const rtpTolerance = 0.02; // 2% tolerance

    if (Math.abs(rtp - config.targetRTP) > rtpTolerance) {
        errors.push(`RTP ${(rtp * 100).toFixed(2)}% outside target ${(config.targetRTP * 100).toFixed(2)}%`);
    }

    return {
        valid: errors.length === 0,
        errors,
        rtp,
    };
};

/**
 * Run validation tests for all row/risk combinations
 */
export const runMultiplierTests = (): void => {
    console.log('=== Plinko Multiplier Tests ===\n');

    const risks: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

    for (let rows = 8; rows <= 16; rows++) {
        for (const risk of risks) {
            const multipliers = generatePlinkoMultipliers(rows, risk);
            const validation = validateMultipliers(rows, risk, multipliers);

            console.log(`Rows: ${rows}, Risk: ${risk.padEnd(6)}`);
            console.log(`  Multipliers: [${multipliers.join(', ')}]`);
            console.log(`  RTP: ${(validation.rtp * 100).toFixed(2)}%`);
            console.log(`  Valid: ${validation.valid ? '✓' : '✗'}`);
            if (!validation.valid) {
                console.log(`  Errors: ${validation.errors.join(', ')}`);
            }
            console.log('');
        }
    }
};

// =====================================================
// PRECOMPUTED TABLES (for SQL and fast lookup)
// =====================================================

/**
 * Generate all multiplier tables for rows 8-16
 */
export const generateAllMultiplierTables = (): Record<number, Record<string, number[]>> => {
    const tables: Record<number, Record<string, number[]>> = {};

    for (let rows = 8; rows <= 16; rows++) {
        tables[rows] = {
            low: generatePlinkoMultipliers(rows, 'low'),
            medium: generatePlinkoMultipliers(rows, 'medium'),
            high: generatePlinkoMultipliers(rows, 'high'),
        };
    }

    return tables;
};

/**
 * Get multiplier for specific position
 */
export const getMultiplier = (
    rows: number,
    risk: 'low' | 'medium' | 'high',
    position: number
): number => {
    const multipliers = generatePlinkoMultipliers(rows, risk);
    return multipliers[position] ?? 0;
};

/**
 * Get house edge for risk tier
 */
export const getHouseEdge = (risk: 'low' | 'medium' | 'high'): number => {
    return 1 - RISK_CONFIGS[risk].targetRTP;
};

// =====================================================
// EXPORTS
// =====================================================

export default {
    generatePlinkoMultipliers,
    calculateRTP,
    validateMultipliers,
    runMultiplierTests,
    generateAllMultiplierTables,
    getMultiplier,
    getHouseEdge,
    binomial,
    slotProbability,
    getAllProbabilities,
};
