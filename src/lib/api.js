// ============================================
// FILE: src/lib/api.js
// ============================================

class APIService {
  constructor() {
    // Pattern Detection API (Railway) - has all the endpoints we need!
    this.baseURL = import.meta.env.VITE_PATTERN_API_URL || 'https://virtual-options-desk-production.up.railway.app';
    
    // WebSocket for real-time data (Railway) - same server
    this.wsURL = import.meta.env.VITE_WS_URL || 'wss://virtual-options-desk-production.up.railway.app';
    
    // ML Stock Screening API (Render) - for advanced features
    this.mlAPI = import.meta.env.VITE_API_URL || 'https://ml-stock-screening-api.onrender.com';
    
    // CrewAI Service (Railway) - for AI analysis
    this.crewAI = import.meta.env.VITE_CREWAI_URL || 'https://feisty-courage-production.up.railway.app';
  }

  async getTopPicks(count = 100, category = null) {
    // Pattern Detection API has this endpoint
    const response = await fetch(`${this.baseURL}/api/picks/top/${count}`);
    if (!response.ok) throw new Error('Failed to fetch picks');
    return response.json();
  }

  async getStockDetails(symbol) {
    // Pattern Detection API has this endpoint
    const response = await fetch(`${this.baseURL}/api/stock/${symbol}`);
    if (!response.ok) throw new Error('Failed to fetch stock details');
    return response.json();
  }

  async getPatterns(symbol, timeframe = '1d', days = 7) {
    // Pattern Detection API has this endpoint
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
