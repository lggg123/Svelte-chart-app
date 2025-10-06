// ============================================
// MOCK BACKEND SERVER FOR TESTING
// Run with: node mock-server.js
// ============================================

import { WebSocketServer } from 'ws';
import http from 'http';

const HTTP_PORT = 8002;
const WS_PORT = 8003;

// ============================================
// HTTP API Server
// ============================================

const httpServer = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${HTTP_PORT}`);

  // GET /api/picks/top/:count
  if (url.pathname.match(/^\/api\/picks\/top\/\d+$/)) {
    const picks = Array.from({ length: 10 }, (_, i) => ({
      symbol: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'AMD', 'INTC', 'NFLX'][i],
      name: `Company ${i + 1}`,
      price: 150 + Math.random() * 100,
      change: (Math.random() - 0.5) * 10,
      volume: Math.floor(Math.random() * 10000000)
    }));
    
    res.writeHead(200);
    res.end(JSON.stringify(picks));
    return;
  }

  // GET /api/stock/:symbol
  if (url.pathname.match(/^\/api\/stock\/[A-Z]+$/)) {
    const symbol = url.pathname.split('/').pop();
    const stock = {
      symbol,
      name: `${symbol} Inc.`,
      price: 150 + Math.random() * 50,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000)
    };
    
    res.writeHead(200);
    res.end(JSON.stringify(stock));
    return;
  }

  // GET /api/patterns/:symbol
  if (url.pathname.match(/^\/api\/patterns\/[A-Z]+$/)) {
    const patterns = Array.from({ length: 5 }, (_, i) => ({
      pattern_type: ['hammer', 'doji', 'engulfing', 'shooting_star', 'morning_star'][i % 5],
      direction: i % 2 === 0 ? 'bullish' : 'bearish',
      confidence: 0.7 + Math.random() * 0.3,
      strength: Math.floor(Math.random() * 5) + 1,
      timestamp: new Date(Date.now() - i * 3600000).toISOString()
    }));
    
    res.writeHead(200);
    res.end(JSON.stringify(patterns));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`✅ Mock HTTP API server running on http://localhost:${HTTP_PORT}`);
});

// ============================================
// WebSocket Server
// ============================================

const wss = new WebSocketServer({ port: WS_PORT });

function generateCandle(basePrice, timestamp) {
  const open = basePrice + (Math.random() - 0.5) * 2;
  const close = open + (Math.random() - 0.5) * 3;
  const high = Math.max(open, close) + Math.random() * 1;
  const low = Math.min(open, close) - Math.random() * 1;
  const volume = Math.floor(Math.random() * 1000000) + 100000;

  return {
    timestamp: timestamp.toISOString(),
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
    volume
  };
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `ws://localhost:${WS_PORT}`);
  const symbol = url.pathname.split('/').pop();
  const timeframe = url.searchParams.get('timeframe') || '1m';

  console.log(`📊 Client connected for ${symbol} (${timeframe})`);

  // Send historical data
  const now = new Date();
  let basePrice = 150 + Math.random() * 50;
  const historical = [];
  
  for (let i = 100; i > 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
    historical.push(generateCandle(basePrice, timestamp));
    basePrice = historical[historical.length - 1].close;
  }

  ws.send(JSON.stringify({
    type: 'historical',
    data: historical
  }));

  // Send periodic updates
  let currentPrice = basePrice;
  const updateInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      const candle = generateCandle(currentPrice, new Date());
      currentPrice = candle.close;

      ws.send(JSON.stringify({
        type: 'candle_update',
        data: candle
      }));

      // Randomly send pattern detection (10% chance)
      if (Math.random() < 0.1) {
        const patterns = ['hammer', 'doji', 'engulfing', 'shooting_star', 'morning_star', 'hanging_man'];
        const pattern = {
          pattern_type: patterns[Math.floor(Math.random() * patterns.length)],
          direction: Math.random() > 0.5 ? 'bullish' : 'bearish',
          confidence: 0.7 + Math.random() * 0.3,
          strength: Math.floor(Math.random() * 5) + 1,
          timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify({
          type: 'pattern_detected',
          data: pattern
        }));
      }
    }
  }, 2000); // Update every 2 seconds

  // Send heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'heartbeat' }));
    }
  }, 30000); // Every 30 seconds

  ws.on('close', () => {
    console.log(`❌ Client disconnected for ${symbol}`);
    clearInterval(updateInterval);
    clearInterval(heartbeatInterval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(updateInterval);
    clearInterval(heartbeatInterval);
  });
});

console.log(`✅ Mock WebSocket server running on ws://localhost:${WS_PORT}`);
console.log('\n🚀 Mock backend ready! Start your Svelte app with: npm run dev\n');
