<script>
  import { selectedSymbol, currentPrice, priceChange, isConnected } from './lib/stores';
  import WebSocketManager from './lib/WebSocketManager.svelte';
  import CandlestickChart from './lib/CandlestickChart.svelte';
  import ChartControls from './lib/ChartControls.svelte';
  import PatternsList from './lib/PatternsList.svelte';

  let searchSymbol = $selectedSymbol;
  let showVolume = true;
  let showMA = false;

  // Popular stocks for quick access
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'GOOGL', name: 'Alphabet' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'NFLX', name: 'Netflix' }
  ];

  function selectStock(symbol) {
    searchSymbol = symbol;
    selectedSymbol.set(symbol);
  }

  // Responsive chart sizing
  import { onMount, onDestroy } from 'svelte';
  let chartWidth = 1200;
  let chartHeight = 600;
  let resizeHandler;
  function updateChartSize() {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 600) {
        chartWidth = window.innerWidth - 32;
        chartHeight = 260;
      } else if (window.innerWidth < 900) {
        chartWidth = window.innerWidth - 64;
        chartHeight = 340;
      } else {
        chartWidth = 1200;
        chartHeight = 500;
      }
    }
  }
  onMount(() => {
    updateChartSize();
    resizeHandler = () => updateChartSize();
    window.addEventListener('resize', resizeHandler);
  });
  onDestroy(() => {
    window.removeEventListener('resize', resizeHandler);
  });

  let isMobile = false;
  function handleSymbolSearch() {
    if (searchSymbol) {
      selectedSymbol.set(searchSymbol.toUpperCase());
    }
  }
  $: isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
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
          placeholder="Enter symbol (e.g., NVDA)..."
          on:keydown={(e) => e.key === 'Enter' && handleSymbolSearch()}
        />
        <button on:click={handleSymbolSearch}>Search</button>
      </div>
    </header>

    <!-- Popular Stocks Bar -->
    <div class="popular-stocks">
      <h3>Popular Stocks:</h3>
      <div class="stock-buttons">
        {#each popularStocks as stock}
          <button
            class="stock-btn"
            class:active={$selectedSymbol === stock.symbol}
            on:click={() => selectStock(stock.symbol)}
            title={stock.name}
          >
            {stock.symbol}
          </button>
        {/each}
      </div>
    </div>

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


    <!-- Chart controls: timeframe always above, indicators below on mobile -->
    <ChartControls 
      bind:showVolume 
      bind:showMA 
      indicatorsBelow={isMobile}
    />

    <!-- Main chart -->
    <div class="chart-container">
      <CandlestickChart width={chartWidth} height={chartHeight} />
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
  main {
    padding: 2rem;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
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

  .popular-stocks {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    margin-bottom: 1rem;
  }

  .popular-stocks h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #9ca3af;
    font-weight: 500;
  }

  .stock-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .stock-btn {
    padding: 0.625rem 1.25rem;
    background: #2a2a2a;
    color: #e5e7eb;
    border: 2px solid #3a3a3a;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    transition: all 0.2s;
    min-width: 80px;
  }

  .stock-btn:hover {
    background: #3a3a3a;
    border-color: #4a4a4a;
    transform: translateY(-1px);
  }

  .stock-btn.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: white;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  .symbol-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: #1a1a1a;
    border-radius: 12px;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
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
    width: 100%;
    overflow-x: auto;
    max-width: 100vw;
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

  /* Responsive styles for mobile */
  @media (max-width: 900px) {
    .container {
      max-width: 100vw;
      padding: 0 1rem;
    }
    main {
      padding: 1rem;
    }
    .popular-stocks {
      padding: 1rem;
    }
    .popular-stocks h3 {
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }
    .stock-buttons {
      gap: 0.5rem;
    }
    .stock-btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      min-width: 70px;
    }
    .symbol-info {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      padding: 1rem;
    }
    .chart-container {
      margin: 1rem 0;
      max-width: 100vw;
    }
    h1 {
      font-size: 1.5rem;
    }
    .current-price {
      font-size: 1.5rem;
    }
    .symbol-name h2 {
      font-size: 1.2rem;
    }
  }

  @media (max-width: 600px) {
    .container {
      max-width: 100vw;
      padding: 0 0.5rem;
    }
    main {
      padding: 0.5rem;
    }
    header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .popular-stocks {
      padding: 0.75rem;
    }
    .popular-stocks h3 {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .stock-buttons {
      gap: 0.4rem;
    }
    .stock-btn {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      min-width: 60px;
    }
    .symbol-info {
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
      padding: 0.5rem;
    }
    .chart-container {
      margin: 0.5rem 0;
      max-width: 100vw;
    }
    h1 {
      font-size: 1.1rem;
    }
    .current-price {
      font-size: 1.1rem;
    }
    .symbol-name h2 {
      font-size: 1rem;
    }
  }
</style>
