// ============================================
// FILE: src/lib/stores.js
// Svelte stores for reactive state
// ============================================

import { writable, derived } from 'svelte/store';

// Candle data store
export const candles = writable([]);
export const patterns = writable([]);
export const currentPrice = writable(0);
export const isConnected = writable(false);
export const selectedSymbol = writable('AAPL');
export const selectedTimeframe = writable('1d');

// Derived stores
export const priceChange = derived(
  [candles],
  ([$candles]) => {
    if ($candles.length < 2) return { change: 0, changePercent: 0 };
    const latest = $candles[$candles.length - 1];
    const change = latest.close - latest.open;
    const changePercent = (change / latest.open) * 100;
    return { change, changePercent };
  }
);

export const candleStats = derived(
  [candles],
  ([$candles]) => {
    if ($candles.length === 0) return null;

    const closes = $candles.map(c => c.close);
    const volumes = $candles.map(c => c.volume);

    return {
      high: Math.max(...closes),
      low: Math.min(...closes),
      avgVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
      volatility: calculateVolatility(closes)
    };
  }
);

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  const mean = returns.reduce((a, b) => a + b) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized
}
