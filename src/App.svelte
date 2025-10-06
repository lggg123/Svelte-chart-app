<script>
  import { selectedSymbol, currentPrice, priceChange, isConnected } from './lib/stores';
  import WebSocketManager from './lib/WebSocketManager.svelte';
  import CandlestickChart from './lib/CandlestickChart.svelte';
  import ChartControls from './lib/ChartControls.svelte';
  import PatternsList from './lib/PatternsList.svelte';

  let searchSymbol = $selectedSymbol;
  let showVolume = true;
  let showMA = false;

  function handleSymbolSearch() {
    if (searchSymbol) {
      selectedSymbol.set(searchSymbol.toUpperCase());
    }
  }
</script>

<WebSocketManager />

<main>
  <div class="container">
    <!-- Header -->
    <header>
      <div class="header-left">
        <h1>📊 AI Stock Charts</h1>
        <div class="connection-status" class:connected={$isConnected}>
          {$isConnected ? '🟢 Live' : '🔴 Disconnected'}
        </div>
      </div>

      <!-- Symbol search -->
      <div class="symbol-search">
        <input
          type="text"
          bind:value={searchSymbol}
          placeholder="Enter symbol..."
          on:keydown={(e) => e.key === 'Enter' && handleSymbolSearch()}
        />
        <button on:click={handleSymbolSearch}>Search</button>
      </div>
    </header>

    <!-- Current symbol info -->
    <div class="symbol-info">
      <div class="symbol-name">
        <h2>{$selectedSymbol}</h2>
      </div>
      <div class="price-info">
        <div class="current-price">${$currentPrice.toFixed(2)}</div>
        <div class="price-change" class:positive={$priceChange.change >= 0}>
          {$priceChange.change >= 0 ? '+' : ''}{$priceChange.change.toFixed(2)}
          ({$priceChange.changePercent >= 0 ? '+' : ''}{$priceChange.changePercent.toFixed(2)}%)
        </div>
      </div>
    </div>

    <!-- Chart controls -->
    <ChartControls 
      bind:showVolume 
      bind:showMA 
    />

    <!-- Main chart -->
    <div class="chart-container">
      <CandlestickChart width={1200} height={600} />
    </div>

    <!-- Patterns list -->
    <PatternsList />

    <!-- Footer -->
    <footer>
      <p>
        Real-time AI-powered stock charts • 
        <a href="https://yourapp.com/pricing" target="_blank">Upgrade to Pro</a> 
        for unlimited access
      </p>
    </footer>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: white;
  }

  main {
    padding: 2rem;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  h1 {
    font-size: 2rem;
    margin: 0;
  }

  .connection-status {
    padding: 0.5rem 1rem;
    background: #2a2a2a;
    border-radius: 20px;
    font-size: 0.875rem;
  }

  .connection-status.connected {
    background: rgba(34, 197, 94, 0.2);
    color: #22c55e;
  }

  .symbol-search {
    display: flex;
    gap: 0.5rem;
  }

  .symbol-search input {
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border: 2px solid #3a3a3a;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    min-width: 200px;
  }

  .symbol-search input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .symbol-search button {
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .symbol-search button:hover {
    background: #2563eb;
  }

  .symbol-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: #1a1a1a;
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .symbol-name h2 {
    margin: 0;
    font-size: 2rem;
  }

  .price-info {
    text-align: right;
  }

  .current-price {
    font-size: 2.5rem;
    font-weight: bold;
  }

  .price-change {
    font-size: 1.25rem;
    color: #ef4444;
  }

  .price-change.positive {
    color: #22c55e;
  }

  .chart-container {
    display: flex;
    justify-content: center;
    margin: 2rem 0;
  }

  footer {
    text-align: center;
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid #2a2a2a;
    color: #9ca3af;
  }

  footer a {
    color: #3b82f6;
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>
