# 🏗️ Application Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              App.svelte (Main UI)                   │    │
│  │                                                      │    │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │    │
│  │  │   Header    │  │ Symbol Info  │  │  Footer   │ │    │
│  │  │  & Search   │  │  & Price     │  │           │ │    │
│  │  └─────────────┘  └──────────────┘  └───────────┘ │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │       ChartControls.svelte                   │   │    │
│  │  │  [1M] [5M] [15M] [1H] [4H] [1D] [1W]       │   │    │
│  │  │  [ ] Volume  [ ] Moving Averages            │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │     CandlestickChart.svelte                  │   │    │
│  │  │                                               │   │    │
│  │  │     [Canvas Element]                         │   │    │
│  │  │     • Draws candlesticks                     │   │    │
│  │  │     • Draws volume bars                      │   │    │
│  │  │     • Draws grid & axes                      │   │    │
│  │  │     • Draws pattern markers                  │   │    │
│  │  │                                               │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐   │    │
│  │  │       PatternsList.svelte                    │   │    │
│  │  │  [🟢 Hammer] [🔴 Doji] [🟢 Engulfing]      │   │    │
│  │  └─────────────────────────────────────────────┘   │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │       WebSocketManager.svelte (Hidden)             │    │
│  │       • Manages WebSocket connection               │    │
│  │       • Handles reconnection logic                 │    │
│  │       • Updates stores with incoming data          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
                    WebSocket (WS)
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         HTTP API (Port 8002)                        │    │
│  │  • GET /api/picks/top/:count                       │    │
│  │  • GET /api/stock/:symbol                          │    │
│  │  • GET /api/patterns/:symbol                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │      WebSocket Server (Port 8003)                   │    │
│  │  • WS /ws/live/:symbol                             │    │
│  │  • Streams candlestick data                        │    │
│  │  • Sends pattern detections                        │    │
│  │  • Sends heartbeats                                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.svelte
├── WebSocketManager.svelte (manages data flow)
├── Header
│   ├── Logo & Title
│   ├── Connection Status Badge
│   └── Symbol Search Input
├── Symbol Info Panel
│   ├── Symbol Name
│   ├── Current Price
│   └── Price Change
├── ChartControls.svelte
│   ├── Timeframe Buttons
│   └── Indicator Toggles
├── CandlestickChart.svelte
│   └── Canvas (renders chart)
├── PatternsList.svelte
│   └── Pattern Cards
└── Footer
```

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     DATA STORES                          │
│                    (stores.js)                           │
│                                                          │
│  • candles ──────────────┐                             │
│  • patterns ─────────────┤                             │
│  • currentPrice ─────────┤                             │
│  • isConnected ──────────┼──────> Reactive Updates     │
│  • selectedSymbol ───────┤                             │
│  • selectedTimeframe ────┤                             │
│  • priceChange (derived) ┤                             │
│  • candleStats (derived) ┘                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
         ↑                              ↓
         │                              │
         │ Update                       │ Subscribe
         │                              │
┌────────┴─────────┐         ┌──────────┴────────────┐
│  WebSocket       │         │    UI Components       │
│  Manager         │         │                        │
│                  │         │  • App.svelte          │
│  • Receives data │         │  • CandlestickChart    │
│  • Parses JSON   │         │  • ChartControls       │
│  • Updates stores│         │  • PatternsList        │
└──────────────────┘         └───────────────────────┘
```

## WebSocket Message Flow

```
1. Connection Established
   ┌──────────┐              ┌──────────┐
   │ Client   │────Connect──>│  Server  │
   │          │<───Accept────│          │
   └──────────┘              └──────────┘

2. Historical Data
   ┌──────────┐              ┌──────────┐
   │ Client   │              │  Server  │
   │          │<───100 bars──│          │
   └──────────┘              └──────────┘
        │
        ├─> candles.set([...])
        └─> Chart renders

3. Live Updates (every 2 seconds)
   ┌──────────┐              ┌──────────┐
   │ Client   │              │  Server  │
   │          │<─New candle──│          │
   └──────────┘              └──────────┘
        │
        ├─> candles.update()
        ├─> currentPrice.set()
        └─> Chart re-renders

4. Pattern Detection (random)
   ┌──────────┐              ┌──────────┐
   │ Client   │              │  Server  │
   │          │<──Pattern────│          │
   └──────────┘              └──────────┘
        │
        ├─> patterns.update()
        ├─> Show notification
        └─> Add marker to chart

5. Heartbeat (every 30 seconds)
   ┌──────────┐              ┌──────────┐
   │ Client   │              │  Server  │
   │          │<─Heartbeat───│          │
   └──────────┘              └──────────┘
        │
        └─> Keep connection alive
```

## Canvas Rendering Pipeline

```
draw() function called
    ↓
Clear canvas
    ↓
Calculate scales (price range, time range)
    ↓
┌─────────────────────┐
│  Draw Background    │
│  • Grid lines       │
│  • Price levels     │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Draw Volume Bars   │
│  • Green (bullish)  │
│  • Red (bearish)    │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Draw Candlesticks  │
│  For each candle:   │
│    • Draw wick      │
│    • Draw body      │
│    • Color by trend │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Draw Pattern       │
│  Markers            │
│  • 🟢/🔴 icons     │
│  • Pattern labels   │
└─────────────────────┘
    ↓
┌─────────────────────┐
│  Draw Price Axis    │
│  • Y-axis labels    │
│  • Current price    │
│  • Price line       │
└─────────────────────┘
    ↓
Render to screen
```

## State Management

```
User Actions → Components → Stores → All Subscribers
                    ↓
              WebSocket Manager
                    ↓
              API Calls / WS Messages
```

### Example: Changing Symbol

```
1. User types "TSLA" and presses Enter
   ↓
2. handleSymbolSearch() in App.svelte
   ↓
3. selectedSymbol.set("TSLA")
   ↓
4. WebSocketManager reactive statement triggers
   ↓
5. Disconnect old WebSocket
   ↓
6. Clear candles and patterns stores
   ↓
7. Connect new WebSocket for TSLA
   ↓
8. Receive historical data
   ↓
9. Update candles store
   ↓
10. Chart component re-renders with new data
```

## Performance Optimizations

1. **Canvas Rendering**
   - Hardware-accelerated
   - Only redraws on data changes
   - Uses requestAnimationFrame

2. **Data Limits**
   - Max 500 candles in memory
   - Display last 100 candles
   - Automatic cleanup of old data

3. **WebSocket**
   - Automatic reconnection
   - Heartbeat to keep alive
   - Efficient JSON parsing

4. **Svelte Reactivity**
   - Fine-grained updates
   - Only affected components re-render
   - Derived stores for computed values

## Technology Stack

```
┌──────────────────────────────────────┐
│         Frontend Stack                │
├──────────────────────────────────────┤
│ Svelte 5         │ UI Framework       │
│ Vite             │ Build Tool         │
│ Canvas API       │ Chart Rendering    │
│ WebSocket API    │ Real-time Data     │
│ D3 (scale/shape) │ Data Utilities     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│       Backend Stack (Mock)            │
├──────────────────────────────────────┤
│ Node.js          │ Runtime            │
│ HTTP Module      │ REST API           │
│ WS Package       │ WebSocket Server   │
└──────────────────────────────────────┘
```

## File Structure & Responsibilities

```
src/
├── App.svelte
│   └── Main layout and composition
│
├── lib/
│   ├── api.js
│   │   └── HTTP API service wrapper
│   │
│   ├── stores.js
│   │   └── Global state management
│   │
│   ├── WebSocketManager.svelte
│   │   ├── Connection lifecycle
│   │   ├── Message handling
│   │   └── Store updates
│   │
│   ├── CandlestickChart.svelte
│   │   ├── Canvas rendering
│   │   ├── Drawing functions
│   │   └── Price calculations
│   │
│   ├── ChartControls.svelte
│   │   ├── Timeframe selector
│   │   └── Indicator toggles
│   │
│   └── PatternsList.svelte
│       ├── Pattern cards
│       └── Pattern formatting
│
└── main.js
    └── App initialization
```

## Security Considerations

1. **WebSocket**
   - Use WSS in production
   - Implement authentication
   - Validate all incoming data

2. **API**
   - Use HTTPS in production
   - Add API key authentication
   - Rate limiting

3. **Environment Variables**
   - Never commit `.env` to git
   - Use different configs per environment
   - Secure sensitive data

## Scalability Notes

**Current Limits:**
- 100 visible candles
- 500 candles in memory
- 2 second update interval

**To Scale:**
- Implement virtual scrolling
- Use Web Workers for calculations
- Add data pagination
- Implement caching strategy
- Use CDN for static assets

---

This architecture provides:
- ✅ Real-time updates
- ✅ Smooth performance
- ✅ Clean separation of concerns
- ✅ Easy to maintain and extend
- ✅ Production-ready structure
