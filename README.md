# 📊 Svelte Candlestick Chart Application

Ultra-fast real-time stock charts with AI-powered pattern detection built with Svelte and Vite.

## Features

- 🚀 **Real-time WebSocket Updates** - Live candlestick data streaming
- 🎨 **High-Performance Canvas Rendering** - Smooth 60fps chart animations
- 🤖 **AI Pattern Detection** - Automatic detection of bullish/bearish patterns
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔔 **Browser Notifications** - Alerts for detected patterns
- ⚡ **Multiple Timeframes** - 1m, 5m, 15m, 1h, 4h, 1d, 1w
- 📊 **Volume Bars** - Integrated volume visualization
- 🎯 **Real-time Price Updates** - Live price tracking with change indicators

## Project Structure

```
src/
├── lib/
│   ├── api.js                    # API service for backend communication
│   ├── stores.js                 # Svelte stores for reactive state
│   ├── WebSocketManager.svelte   # WebSocket connection management
│   ├── CandlestickChart.svelte   # Canvas-based chart component
│   ├── ChartControls.svelte      # Timeframe and indicator controls
│   └── PatternsList.svelte       # Detected patterns display
├── App.svelte                    # Main application component
└── main.js                       # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Edit `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8002
   VITE_WS_URL=ws://localhost:8003
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to `http://localhost:5173/`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Backend Requirements

This frontend application requires a backend server providing:

1. **REST API endpoints:**
   - `GET /api/picks/top/:count` - Top stock picks
   - `GET /api/stock/:symbol` - Stock details
   - `GET /api/patterns/:symbol` - Pattern history

2. **WebSocket endpoint:**
   - `WS /ws/live/:symbol` - Real-time candlestick data

### Expected WebSocket Message Format

```javascript
// Historical data
{
  "type": "historical",
  "data": [
    {
      "timestamp": "2025-10-06T12:00:00Z",
      "open": 150.25,
      "high": 151.50,
      "low": 149.75,
      "close": 151.00,
      "volume": 1000000
    }
  ]
}

// Candle update
{
  "type": "candle_update",
  "data": {
    "timestamp": "2025-10-06T12:01:00Z",
    "open": 151.00,
    "high": 151.75,
    "low": 150.50,
    "close": 151.25,
    "volume": 500000
  }
}

// Pattern detected
{
  "type": "pattern_detected",
  "data": {
    "pattern_type": "hammer",
    "direction": "bullish",
    "confidence": 0.85,
    "strength": 4,
    "timestamp": "2025-10-06T12:01:00Z"
  }
}
```

## Technologies Used

- **Svelte** - Reactive UI framework
- **Vite** - Fast build tool
- **Canvas API** - High-performance chart rendering
- **WebSocket** - Real-time data streaming
- **D3** - Data manipulation utilities
- **Lightweight Charts** - Chart utilities

## Configuration

### Customizing Chart Appearance

Edit `src/lib/CandlestickChart.svelte`:

```javascript
// Colors
const bullishColor = '#22c55e';  // Green
const bearishColor = '#ef4444';  // Red
const gridColor = '#2a2a2a';
const backgroundColor = '#1a1a1a';

// Dimensions
const padding = { top: 20, right: 80, bottom: 40, left: 60 };
```

### Adding More Timeframes

Edit `src/lib/ChartControls.svelte`:

```javascript
const timeframes = [
  { value: '1m', label: '1M' },
  { value: '5m', label: '5M' },
  // Add more timeframes here
];
```

## Performance Optimization

- Chart only renders last 100 candles for optimal performance
- Stores maximum 500 candles in memory
- Canvas rendering with hardware acceleration
- Debounced WebSocket updates

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Svelte and Vite

This template should help get you started developing with Svelte in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Need an official Svelte framework?

Check out [SvelteKit](https://github.com/sveltejs/kit#readme), which is also powered by Vite. Deploy anywhere with its serverless-first approach and adapt to various platforms, with out of the box support for TypeScript, SCSS, and Less, and easily-added support for mdsvex, GraphQL, PostCSS, Tailwind CSS, and more.

## Technical considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.

**Why include `.vscode/extensions.json`?**

Other templates indirectly recommend extensions via the README, but this file allows VS Code to prompt the user to install the recommended extension upon opening the project.

**Why enable `checkJs` in the JS template?**

It is likely that most cases of changing variable types in runtime are likely to be accidental, rather than deliberate. This provides advanced typechecking out of the box. Should you like to take advantage of the dynamically-typed nature of JavaScript, it is trivial to change the configuration.

**Why is HMR not preserving my local component state?**

HMR state preservation comes with a number of gotchas! It has been disabled by default in both `svelte-hmr` and `@sveltejs/vite-plugin-svelte` due to its often surprising behavior. You can read the details [here](https://github.com/sveltejs/svelte-hmr/tree/master/packages/svelte-hmr#preservation-of-local-state).

If you have state that's important to retain within a component, consider creating an external store which would not be replaced by HMR.

```js
// store.js
// An extremely simple external store
import { writable } from 'svelte/store'
export default writable(0)
```
