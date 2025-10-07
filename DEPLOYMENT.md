# 🚀 Deployment Guide

## Backend Services Overview

This application uses multiple deployed backend services:

### 1. ML Stock Screening API (Render)
- **URL**: `https://ml-stock-screening-api.onrender.com`
- **Purpose**: Stock data and top picks

### 2. Pattern Detection API with WebSocket (Railway)
- **URL**: `https://virtual-options-desk-production.up.railway.app`
- **Purpose**: Real-time pattern detection and live candlestick data

### 3. CrewAI Service (Railway)
- **URL**: `https://feisty-courage-production.up.railway.app`
- **Purpose**: AI-powered analysis and insights

---

## Deploying to Vercel

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project settings → Environment Variables and add:

1. **VITE_API_URL**
   - Value: `https://ml-stock-screening-api.onrender.com`
   - Apply to: Production, Preview, Development

2. **VITE_PATTERN_API_URL**
   - Value: `https://virtual-options-desk-production.up.railway.app`
   - Apply to: Production, Preview, Development

3. **VITE_WS_URL**
   - Value: `wss://virtual-options-desk-production.up.railway.app`
   - **Important**: Use `wss://` (secure WebSocket) not `ws://`
   - Apply to: Production, Preview, Development

4. **VITE_CREWAI_URL**
   - Value: `https://feisty-courage-production.up.railway.app`
   - Apply to: Production, Preview, Development

### Step 2: Verify Backend Endpoints

Your backend API must support these endpoints:

#### REST API Endpoints:
- `GET /api/picks/top/:count` - Get top stock picks
- `GET /api/stock/:symbol` - Get stock details
- `GET /api/patterns/:symbol?timeframe=1d&days=7` - Get detected patterns

#### WebSocket Endpoint:
- `wss://your-domain/ws/live/:symbol?timeframe=1m` - Real-time data stream

#### WebSocket Message Format:

**Server → Client Messages:**

1. **Historical Data** (initial connection):
```json
{
  "type": "historical",
  "data": [
    {
      "timestamp": "2025-10-07T12:00:00Z",
      "open": 150.25,
      "high": 151.50,
      "low": 149.80,
      "close": 151.00,
      "volume": 1000000
    }
  ]
}
```

2. **Candle Update** (every interval):
```json
{
  "type": "candle_update",
  "data": {
    "timestamp": "2025-10-07T12:01:00Z",
    "open": 151.00,
    "high": 151.75,
    "low": 150.90,
    "close": 151.50,
    "volume": 1500000
  }
}
```

3. **Pattern Detected**:
```json
{
  "type": "pattern_detected",
  "data": {
    "pattern_type": "hammer",
    "direction": "bullish",
    "confidence": 0.85,
    "strength": 4,
    "timestamp": "2025-10-07T12:01:00Z"
  }
}
```

4. **Heartbeat** (keep-alive):
```json
{
  "type": "heartbeat"
}
```

### Step 3: CORS Configuration

Your backend must allow CORS from your Vercel domain:

```javascript
// Example for Node.js/Express
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://your-app.vercel.app');
  // OR for development + production:
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### Step 4: Deploy to Vercel

#### Option A: Deploy from GitHub (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `lggg123/Svelte-chart-app`
4. Vercel will auto-detect it's a Vite project
5. Add environment variables (Step 1)
6. Click "Deploy"

#### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_URL production
vercel env add VITE_WS_URL production
```

### Step 5: Test Your Deployment

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Check browser console (F12) for:
   - ✅ "WebSocket connected for AAPL (1d)"
   - ✅ No CORS errors
   - ✅ Candle data loading
3. Verify the chart renders with live data
4. Test pattern detection cards appear

---

## Local Development

The mock server is **only for local development**. You don't need to deploy it.

### Running Locally with Mock Server

```bash
# Terminal 1: Start mock backend
npm run mock-server

# Terminal 2: Start dev server
npm run dev
```

### Running Locally with Real Backend

Update `.env` with your deployed backend URLs:

```env
VITE_API_URL=https://your-api-domain.com
VITE_WS_URL=wss://your-websocket-domain.com
```

Then just run:
```bash
npm run dev
```

---

## Troubleshooting

### Issue: Chart not loading / No data

**Check:**
1. Browser console for errors
2. Network tab → WS → Check WebSocket connection
3. Verify environment variables in Vercel dashboard
4. Test backend endpoints directly (use Postman/curl)

### Issue: CORS errors

**Fix:**
- Add your Vercel domain to backend CORS whitelist
- Or temporarily use `Access-Control-Allow-Origin: *` for testing

### Issue: WebSocket connection failed

**Check:**
1. Backend WebSocket server is running
2. Using `wss://` (secure) not `ws://` in production
3. Firewall allows WebSocket connections
4. Test WebSocket with browser console:
```javascript
const ws = new WebSocket('wss://your-domain/ws/live/AAPL?timeframe=1d');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

### Issue: Pattern detection not working

**Check:**
1. Backend is sending `pattern_detected` messages
2. Message format matches expected structure
3. Browser notifications are enabled

---

## Environment Variables Reference

| Variable | Local Development | Production |
|----------|------------------|------------|
| `VITE_API_URL` | `http://localhost:8002` | `https://your-api-domain.com` |
| `VITE_WS_URL` | `ws://localhost:8003` | `wss://your-websocket-domain.com` |

---

## Build Settings (Vercel)

Vercel should auto-detect these, but if needed:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

---

## Next Steps

1. ✅ Set Vercel environment variables
2. ✅ Verify backend CORS configuration
3. ✅ Deploy to Vercel
4. ✅ Test live deployment
5. 🎉 Share your live app!

Your app should now display live candlestick charts with real-time pattern detection!
