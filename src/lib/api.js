// ============================================
// FILE: src/lib/api.js
// ============================================

class APIService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8002';
    this.wsURL = import.meta.env.VITE_WS_URL || 'ws://localhost:8003';
  }

  async getTopPicks(count = 100, category = null) {
    const params = new URLSearchParams({ n: count.toString() });
    if (category) params.append('category', category);

    const response = await fetch(`${this.baseURL}/api/picks/top/${count}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch picks');
    return response.json();
  }

  async getStockDetails(symbol) {
    const response = await fetch(`${this.baseURL}/api/stock/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch stock details');
    return response.json();
  }

  async getPatterns(symbol, timeframe = '1d', days = 7) {
    const params = new URLSearchParams({ timeframe, days: days.toString() });
    const response = await fetch(`${this.baseURL}/api/patterns/${symbol}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch patterns');
    return response.json();
  }

  createWebSocket(symbol, timeframe = '1m') {
    return new WebSocket(`${this.wsURL}/ws/live/${symbol}?timeframe=${timeframe}`);
  }
}

export const api = new APIService();
