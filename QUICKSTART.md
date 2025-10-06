# 🚀 Quick Start Guide

## Start the Application in 3 Steps

### Step 1: Start the Mock Backend Server

Open a terminal and run:

```bash
npm run mock-server
```

You should see:
```
✅ Mock HTTP API server running on http://localhost:8002
✅ Mock WebSocket server running on ws://localhost:8003
🚀 Mock backend ready! Start your Svelte app with: npm run dev
```

### Step 2: Start the Frontend App

Open a **new terminal** (keep the first one running) and run:

```bash
npm run dev
```

You should see:
```
ROLLDOWN-VITE v7.1.14  ready in XXXms
➜  Local:   http://localhost:5173/
```

### Step 3: Open in Browser

Navigate to: **http://localhost:5173/**

You should see the AI Stock Charts application with live data streaming!

---

## What You'll See

1. **Header** with connection status (should show 🟢 Live)
2. **Symbol Search** - Search for any stock symbol (AAPL, GOOGL, etc.)
3. **Price Display** - Current price with change indicator
4. **Chart Controls** - Timeframe buttons (1M, 5M, 15M, 1H, 4H, 1D, 1W)
5. **Candlestick Chart** - Live updating chart with volume bars
6. **Pattern Detections** - Cards showing detected patterns (appears randomly)

---

## Test Features

### Change Symbol
1. Type a symbol in the search box (e.g., "TSLA")
2. Press Enter or click Search
3. Watch the chart reload with new data

### Change Timeframe
1. Click any timeframe button (1M, 5M, 15M, etc.)
2. Chart will reload with new timeframe data

### Pattern Detection
- Patterns are randomly detected by the mock server
- When detected, a card will appear at the bottom
- You'll also see markers on the chart (🟢 for bullish, 🔴 for bearish)

### Browser Notifications
- Allow notifications when prompted
- You'll get alerts when patterns are detected

---

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

**For Mock Server (8002/8003):**
```bash
# Kill processes on these ports
lsof -ti:8002 | xargs kill -9
lsof -ti:8003 | xargs kill -9
```

**For Vite Dev Server (5173):**
```bash
lsof -ti:5173 | xargs kill -9
```

### WebSocket Not Connecting

1. Make sure the mock server is running first
2. Check the browser console for errors
3. Verify the .env file has correct URLs:
   ```
   VITE_API_URL=http://localhost:8002
   VITE_WS_URL=ws://localhost:8003
   ```

### No Data Showing

1. Check browser console for errors
2. Verify mock server is running and shows connection messages
3. Try refreshing the page

---

## Development Tips

### Hot Reload
- Any changes to `.svelte` files will hot reload automatically
- Changes to `.js` files may require a page refresh

### View Console Logs
- Open browser DevTools (F12)
- Check Console tab for WebSocket connection messages
- Check Network tab → WS to see WebSocket messages

### Customize Mock Data
- Edit `mock-server.js` to change data patterns
- Restart the mock server after changes

---

## Next Steps

### Connect to Real Backend

1. Update `.env` with your real API URLs:
   ```env
   VITE_API_URL=https://your-api.com
   VITE_WS_URL=wss://your-websocket.com
   ```

2. Ensure your backend matches the expected API format (see README.md)

### Customize Appearance

- Edit colors in `src/lib/CandlestickChart.svelte`
- Modify styles in `src/App.svelte`
- Add new indicators in `src/lib/ChartControls.svelte`

### Deploy to Production

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service (Vercel, Netlify, etc.)

---

## Need Help?

- Check the main `README.md` for detailed documentation
- Review the code comments in each component
- Check the browser console for error messages

Happy coding! 🎉
