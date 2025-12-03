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
  multipliers: {
    8: {
      low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
      medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
      high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    },
    12: {
      low: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
      medium: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
      high: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170]
    },
    16: {
      low: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
      medium: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
      high: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000]
    }
  }
};

export const getMultipliers = (rows: number, risk: 'low' | 'medium' | 'high') => {
  // Fallback to 16 rows if specific row count not defined in simple config
  // In a full app, define all 8-16 configs. Here we map closest for demo.
  if (rows === 8) return PLINKO_CONFIG.multipliers[8][risk];
  if (rows === 12) return PLINKO_CONFIG.multipliers[12][risk];
  return PLINKO_CONFIG.multipliers[16][risk]; 
};

export const getBucketColor = (multiplier: number) => {
  if (multiplier >= 100) return '#ef4444'; // Red
  if (multiplier >= 10) return '#a855f7'; // Purple
  if (multiplier >= 2) return '#3b82f6'; // Blue
  if (multiplier >= 1) return '#22c55e'; // Green
  return '#eab308'; // Yellow/Orange
};
