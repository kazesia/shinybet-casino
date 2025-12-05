/**
 * Plinko Game Configuration
 * 
 * Uses dynamic multiplier generation based on Pascal's Triangle
 * binomial distribution for mathematically accurate RTP.
 */

import { generatePlinkoMultipliers, getHouseEdge, calculateRTP } from '@/lib/plinkoMultipliers';

// =====================================================
// VISUAL CONFIG
// =====================================================

export const PLINKO_CONFIG = {
  width: 800,
  height: 600,
  pegSize: 6,
  ballSize: 10,
  colors: {
    background: '#0f212e',
    peg: '#ffffff',
    ball: '#F7D979',
    text: '#ffffff',
  },
  // Supported row counts
  rows: [8, 9, 10, 11, 12, 13, 14, 15, 16] as const,
  // Risk tiers
  risks: ['low', 'medium', 'high'] as const,
};

export type RiskLevel = 'low' | 'medium' | 'high';
export type RowCount = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

// =====================================================
// MULTIPLIER FUNCTIONS
// =====================================================

/**
 * Get multipliers for given rows and risk level
 * Uses dynamic generation based on binomial distribution
 */
export const getMultipliers = (
  rows: number,
  risk: RiskLevel
): number[] => {
  // Clamp rows to valid range
  const validRows = Math.max(8, Math.min(16, rows));
  return generatePlinkoMultipliers(validRows, risk);
};

/**
 * Get multiplier for specific bucket position
 */
export const getMultiplierAtPosition = (
  rows: number,
  risk: RiskLevel,
  position: number
): number => {
  const multipliers = getMultipliers(rows, risk);
  return multipliers[position] ?? 0;
};

/**
 * Get maximum multiplier for current settings
 */
export const getMaxMultiplier = (rows: number, risk: RiskLevel): number => {
  const multipliers = getMultipliers(rows, risk);
  return Math.max(...multipliers);
};

/**
 * Get expected RTP for current settings
 */
export const getExpectedRTP = (rows: number, risk: RiskLevel): number => {
  const multipliers = getMultipliers(rows, risk);
  return calculateRTP(rows, multipliers);
};

// =====================================================
// BUCKET COLORS
// =====================================================

/**
 * Get color for bucket based on multiplier value
 * Color intensity increases with multiplier
 */
export const getBucketColor = (multiplier: number): string => {
  if (multiplier <= 0) return '#1a1a2e';        // Dark (loss)
  if (multiplier < 0.5) return '#ef4444';       // Red (high loss)
  if (multiplier < 1) return '#f97316';         // Orange (small loss)
  if (multiplier < 2) return '#eab308';         // Yellow (break even)
  if (multiplier < 5) return '#22c55e';         // Green (small win)
  if (multiplier < 10) return '#3b82f6';        // Blue (medium win)
  if (multiplier < 50) return '#8b5cf6';        // Purple (good win)
  if (multiplier < 100) return '#ec4899';       // Pink (great win)
  return '#f43f5e';                             // Rose (jackpot)
};

/**
 * Get gradient for bucket (more premium look)
 */
export const getBucketGradient = (multiplier: number): string => {
  const baseColor = getBucketColor(multiplier);
  return `linear-gradient(180deg, ${baseColor}ff 0%, ${baseColor}99 100%)`;
};

// =====================================================
// DISPLAY HELPERS
// =====================================================

/**
 * Format multiplier for display
 */
export const formatMultiplier = (mult: number): string => {
  if (mult >= 100) return `${mult}×`;
  if (mult >= 10) return `${mult.toFixed(1)}×`;
  return `${mult.toFixed(2)}×`;
};

/**
 * Get risk tier description
 */
export const getRiskDescription = (risk: RiskLevel): string => {
  switch (risk) {
    case 'low':
      return 'Safer payouts, lower variance';
    case 'medium':
      return 'Balanced risk and reward';
    case 'high':
      return 'High variance, massive potential wins';
  }
};

/**
 * Get house edge as percentage string
 */
export const getHouseEdgeDisplay = (risk: RiskLevel): string => {
  const edge = getHouseEdge(risk);
  return `${(edge * 100).toFixed(1)}%`;
};

// =====================================================
// PRECOMPUTED TABLES (for quick lookup)
// =====================================================

// Cache for generated multipliers (avoid recalculation)
const multiplierCache = new Map<string, number[]>();

/**
 * Get cached multipliers (faster for repeated lookups)
 */
export const getCachedMultipliers = (rows: number, risk: RiskLevel): number[] => {
  const key = `${rows}-${risk}`;

  if (!multiplierCache.has(key)) {
    multiplierCache.set(key, getMultipliers(rows, risk));
  }

  return multiplierCache.get(key)!;
};

/**
 * Pre-warm the cache for all combinations
 */
export const warmMultiplierCache = (): void => {
  PLINKO_CONFIG.rows.forEach(rows => {
    PLINKO_CONFIG.risks.forEach(risk => {
      getCachedMultipliers(rows, risk);
    });
  });
};

// =====================================================
// LEGACY SUPPORT (backwards compatibility)
// =====================================================

// Hardcoded multipliers for backwards compatibility
// These are the original Stake.com-style values
export const LEGACY_MULTIPLIERS = {
  8: {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  },
  12: {
    low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
  },
  16: {
    low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
    medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
  },
};

export default PLINKO_CONFIG;
