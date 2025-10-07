# 🔧 WebSocket Troubleshooting Guide

## Current Status

**WebSocket Error**: `❌ WebSocket error: Event { isTrusted: true }`

This error occurs when the WebSocket connection fails to establish. Here's how to diagnose and fix it.

---

## 🔍 Step 1: Test WebSocket Connection Directly

### Option A: Use the Test HTML File

Open `test-websocket.html` in your browser:

```bash
# Open the test file
open test-websocket.html
# Or on Linux
xdg-open test-websocket.html
```

This will show you detailed logs about the connection attempt.

### Option B: Test in Browser Console

1. Open your browser's DevTools (F12)
2. Go to the Console tab
3. Paste this code:

```javascript
const ws = new WebSocket('wss://virtual-options-desk-production.up.railway.app/ws/live/AAPL?timeframe=1d');

ws.onopen = () => console.log('✅ Connected!');
ws.onmessage = (e) => {
  const data = JSON.parse(e.data);
  console.log('📊', data.type, data);
};
ws.onerror = (e) => console.error('❌ Error:', e);
ws.onclose = (e) => console.log('🔴 Closed:', e.code, e.reason);
```

---

## 🔍 Step 2: Check Backend Logs on Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your **virtual-options-desk-production** service
3. Click **Deployments** → **View Logs**
4. Look for:
   - `📊 Client connected for AAPL (1d)` ← Connection successful
   - Any error messages or exceptions
   - Port binding issues

---

## 🔍 Step 3: Common Issues & Fixes

### Issue 1: CORS Policy Blocking WebSocket

**Symptoms:**
- Browser console shows CORS error
- Network tab shows failed WebSocket connection

**Fix:**
Your `pattern_detection_api.py` should have:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: Railway Port Configuration

**Symptoms:**
- Connection times out
- No logs on backend

**Fix:**
Ensure your Railway service uses the `PORT` environment variable:

```python
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### Issue 3: SSL/TLS Certificate Issue

**Symptoms:**
- `wss://` connection fails but `ws://` works locally

**Fix:**
- Railway automatically provides SSL certificates
- Make sure you're using `wss://` (not `ws://`) for production
- Railway URL should be: `wss://virtual-options-desk-production.up.railway.app`

### Issue 4: WebSocket Endpoint Not Found (404)

**Symptoms:**
- Backend logs show 404 error
- Connection closes immediately

**Fix:**
Check the endpoint path matches exactly:

```python
# Backend (pattern_detection_api.py)
@app.websocket("/ws/live/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str, timeframe: str = "1d"):
    # ...

# Frontend (api.js)
createWebSocket(symbol, timeframe = '1m') {
    return new WebSocket(`${this.wsURL}/ws/live/${symbol}?timeframe=${timeframe}`);
}
```

### Issue 5: Backend Service Sleeping (Railway Free Tier)

**Symptoms:**
- First connection takes 20-30 seconds
- Connection succeeds after retry

**Fix:**
- Railway free tier may sleep after inactivity
- First request wakes it up (takes ~20 seconds)
- Keep the service alive with periodic pings
- Or upgrade to Railway Pro plan

---

## 🔍 Step 4: Verify Backend Endpoints

Test the REST API endpoints first:

### Test Health Check
```bash
curl https://virtual-options-desk-production.up.railway.app/health
```

Expected: `{"status":"healthy","timestamp":"...","ml_available":false}`

### Test Stock Data
```bash
curl https://virtual-options-desk-production.up.railway.app/api/stock/AAPL
```

Expected: Stock details JSON

### Test Patterns
```bash
curl "https://virtual-options-desk-production.up.railway.app/api/patterns/AAPL?timeframe=1d&days=7"
```

Expected: Array of detected patterns

---

## 🔍 Step 5: Check Network Tab

1. Open DevTools (F12) → Network tab
2. Filter by **WS** (WebSocket)
3. Click on the WebSocket connection
4. Check:
   - **Status**: Should be `101 Switching Protocols`
   - **Messages**: Should see incoming data
   - **Response Headers**: Check for CORS headers

---

## 🎯 Expected Behavior

When working correctly, you should see:

### Browser Console:
```
✅ WebSocket connected for AAPL (1d)
📊 Received historical candles (100)
💹 Candle update: AAPL @ 182.50
🎯 Pattern detected: hammer (bullish)
💓 Heartbeat
```

### Backend Logs (Railway):
```
📊 Client connected for AAPL (1d)
Fetching historical data for AAPL...
Sending 100 historical candles
Sending candle update...
Pattern detected: hammer
```

---

## 🚨 If Still Not Working

### 1. Check Railway Service Status
- Is the service running?
- Are there any deployment errors?
- Check memory/CPU usage

### 2. Redeploy Backend
```bash
# Trigger a new deployment on Railway
# This ensures latest code is deployed
```

### 3. Check Frontend Environment Variables

On Vercel:
1. Go to Project Settings → Environment Variables
2. Verify:
   ```
   VITE_PATTERN_API_URL=https://virtual-options-desk-production.up.railway.app
   VITE_WS_URL=wss://virtual-options-desk-production.up.railway.app
   ```
3. **Important**: Redeploy after changing environment variables!

### 4. Test with Different Symbol
Sometimes yfinance fails to fetch data for certain symbols:

```javascript
// Try different symbols
const symbols = ['AAPL', 'MSFT', 'GOOGL', 'SPY'];
```

---

## 📞 Need More Help?

Share these details:

1. **Browser Console Output** (full error message)
2. **Railway Backend Logs** (last 50 lines)
3. **Network Tab Screenshot** (WebSocket connection)
4. **Test Results** from Step 1 (test-websocket.html)

---

## ✅ Success Checklist

- [ ] Backend health check returns 200
- [ ] REST API endpoints work (stock details, patterns)
- [ ] WebSocket connects in test-websocket.html
- [ ] Backend logs show "Client connected"
- [ ] Historical data received in browser
- [ ] Live updates appear in console
- [ ] Vercel environment variables set correctly
- [ ] Frontend redeployed after env var changes

---

**Last Updated**: October 7, 2025  
**Status**: Debugging WebSocket Connection
