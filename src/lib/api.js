// ============================================
// FILE: src/lib/api.js
// ============================================

class APIService {
  constructor() {
    // Pattern Detection API (Railway) - has all the endpoints we need!
    this.baseURL = (import.meta.env.VITE_PATTERN_API_URL || 'https://virtual-options-desk-production.up.railway.app').replace(/\/$/, '');

    // WebSocket for real-time data (Railway) - same server
    this.wsURL = (import.meta.env.VITE_WS_URL || 'wss://virtual-options-desk-production.up.railway.app').replace(/\/$/, '');

    // ML Stock Screening API (Render) - for advanced features
    this.mlAPI = (import.meta.env.VITE_API_URL || 'https://ml-stock-screening-api.onrender.com').replace(/\/$/, '');

    // CrewAI Service (Railway) - for AI analysis
    this.crewAI = (import.meta.env.VITE_CREWAI_URL || 'https://feisty-courage-production.up.railway.app').replace(/\/$/, '');

    // EODHD API for stock search
    this.eodhd = {
      baseURL: 'https://eodhd.com/api',
      apiKey: import.meta.env.VITE_EODHD_API_KEY || ''
    };
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

  // EODHD API Methods for searching any stock
  async searchStocks(query) {
    if (!this.eodhd.apiKey) {
      throw new Error('EODHD API key not configured');
    }
    const response = await fetch(
      `${this.eodhd.baseURL}/search/${encodeURIComponent(query)}?api_token=${this.eodhd.apiKey}&limit=15`
    );
    if (!response.ok) throw new Error('Failed to search stocks');
    return response.json();
  }

  async getEODHDQuote(symbol, exchange = 'US') {
    if (!this.eodhd.apiKey) {
      throw new Error('EODHD API key not configured');
    }
    const response = await fetch(
      `${this.eodhd.baseURL}/real-time/${symbol}.${exchange}?api_token=${this.eodhd.apiKey}&fmt=json`
    );
    if (!response.ok) throw new Error('Failed to fetch quote');
    return response.json();
  }

  hasEODHDKey() {
    return !!this.eodhd.apiKey;
  }
}

export const api = new APIService();
