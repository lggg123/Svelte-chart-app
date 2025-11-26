<script>
  import { selectedSymbol, currentPrice, priceChange, isConnected } from './lib/stores';
  import WebSocketManager from './lib/WebSocketManager.svelte';
  import CandlestickChart from './lib/CandlestickChart.svelte';
  import ChartControls from './lib/ChartControls.svelte';
  import PatternsList from './lib/PatternsList.svelte';
  import StockList from './lib/StockList.svelte';
  import { api } from './lib/api';

  let searchSymbol = $selectedSymbol;
  let showVolume = true;
  let showMA = false;
  let showStockList = false;

  // EODHD Search state
  let searchResults = [];
  let showSearchResults = false;
  let searchLoading = false;
  let searchTimeout;

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
    showSearchResults = false;
    searchResults = [];
  }

  // Debounced search using EODHD API
  async function handleSearchInput() {
    clearTimeout(searchTimeout);

    if (!searchSymbol || searchSymbol.length < 1) {
      searchResults = [];
      showSearchResults = false;
      return;
    }

    searchTimeout = setTimeout(async () => {
      if (api.hasEODHDKey()) {
        try {
          searchLoading = true;
          const results = await api.searchStocks(searchSymbol);
          // Filter to show US stocks primarily, then others
          searchResults = results
            .filter(r => r.Code && r.Name)
            .slice(0, 10);
          showSearchResults = searchResults.length > 0;
        } catch (err) {
          console.error('Search failed:', err);
          searchResults = [];
        } finally {
          searchLoading = false;
        }
      }
    }, 300);
  }

  function selectSearchResult(result) {
    const symbol = result.Code;
    searchSymbol = symbol;
    selectedSymbol.set(symbol);
    showSearchResults = false;
    searchResults = [];
  }

  function handleSearchBlur() {
    // Delay hiding to allow click on results
    setTimeout(() => {
      showSearchResults = false;
    }, 200);
  }

  // Responsive chart sizing
  import { onMount, onDestroy } from 'svelte';
  let chartWidth = 1200;
  let chartHeight = 600;
  let resizeHandler;
  function updateChartSize() {
    if (typeof window !== 'undefined') {
      const vw = window.innerWidth;
      if (vw < 600) {
        // Mobile: Full width minus minimal padding, taller height
        chartWidth = vw - 16;
        chartHeight = 400;
      } else if (vw < 900) {
        // Tablet
        chartWidth = vw - 32;
        chartHeight = 450;
      } else {
        // Desktop
        chartWidth = Math.min(1200, vw - 100);
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

      <!-- Symbol search with EODHD autocomplete -->
      <div class="symbol-search">
        <div class="search-input-wrapper">
          <input
            type="text"
            bind:value={searchSymbol}
            placeholder="Search any stock..."
            on:input={handleSearchInput}
            on:keydown={(e) => e.key === 'Enter' && handleSymbolSearch()}
            on:blur={handleSearchBlur}
            on:focus={() => searchResults.length > 0 && (showSearchResults = true)}
          />
          {#if searchLoading}
            <div class="search-spinner"></div>
          {/if}
          {#if showSearchResults && searchResults.length > 0}
            <div class="search-dropdown">
              {#each searchResults as result}
                <button
                  class="search-result"
                  on:mousedown={() => selectSearchResult(result)}
                >
                  <span class="result-symbol">{result.Code}</span>
                  <span class="result-name">{result.Name}</span>
                  <span class="result-exchange">{result.Exchange}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        <button on:click={handleSymbolSearch}>Go</button>
        <button class="browse-btn" on:click={() => showStockList = true}>
          📋 Browse
        </button>
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

{#if showStockList}
  <StockList onClose={() => showStockList = false} />
{/if}

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }

  main {
    padding: 1rem;
    width: 100%;
    box-sizing: border-box;
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
    margin-bottom: 1rem;
    flex-wrap: wrap;
    gap: 1rem;
    width: 100%;
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
    flex: 1;
    min-width: 200px;
  }

  .search-input-wrapper {
    position: relative;
    flex: 1;
    min-width: 120px;
  }

  .search-input-wrapper input {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 2.5rem;
    background: #2a2a2a;
    border: 2px solid #3a3a3a;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .search-input-wrapper input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .search-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    border: 2px solid #3a3a3a;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: translateY(-50%) rotate(360deg); }
  }

  .search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #1a1a1a;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    margin-top: 4px;
    max-height: 300px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  .search-result {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: white;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }

  .search-result:hover {
    background: #2a2a2a;
  }

  .result-symbol {
    font-weight: 700;
    color: #3b82f6;
    min-width: 60px;
  }

  .result-name {
    flex: 1;
    font-size: 0.9rem;
    color: #e5e7eb;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-exchange {
    font-size: 0.75rem;
    color: #6b7280;
    background: #2a2a2a;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
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

  .browse-btn {
    background: #10b981 !important;
    white-space: nowrap;
  }

  .browse-btn:hover {
    background: #059669 !important;
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
    margin: 1rem 0;
    width: 100%;
    overflow: visible;
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
    main {
      padding: 0.75rem;
    }
    .container {
      padding: 0;
    }
    .popular-stocks {
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .popular-stocks h3 {
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }
    .stock-buttons {
      gap: 0.5rem;
    }
    .stock-btn {
      padding: 0.5rem 0.9rem;
      font-size: 0.85rem;
      min-width: 65px;
    }
    .symbol-info {
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .price-info {
      text-align: left;
    }
    h1 {
      font-size: 1.5rem;
    }
    .current-price {
      font-size: 2rem;
    }
    .symbol-name h2 {
      font-size: 1.5rem;
    }
    footer {
      margin-top: 2rem;
      font-size: 0.875rem;
    }
  }

  @media (max-width: 600px) {
    main {
      padding: 0.5rem;
    }
    
    header {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .header-left {
      width: 100%;
      justify-content: space-between;
    }

    h1 {
      font-size: 1.25rem;
    }

    .connection-status {
      padding: 0.4rem 0.75rem;
      font-size: 0.75rem;
    }

    .symbol-search {
      width: 100%;
    }

    .symbol-search input {
      padding: 0.625rem 0.75rem;
      font-size: 0.9rem;
    }

    .symbol-search button {
      padding: 0.625rem 1rem;
      font-size: 0.9rem;
    }

    .browse-btn {
      padding: 0.625rem 0.75rem !important;
    }
    
    .popular-stocks {
      padding: 0.625rem;
      margin-bottom: 0.625rem;
    }
    
    .popular-stocks h3 {
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }
    
    .stock-buttons {
      gap: 0.375rem;
    }
    
    .stock-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      min-width: 55px;
      flex: 1;
    }
    
    .symbol-info {
      padding: 0.75rem;
      margin-bottom: 0.75rem;
      gap: 0.75rem;
    }

    .symbol-name h2 {
      font-size: 1.25rem;
    }
    
    .price-info {
      width: 100%;
      text-align: left;
    }
    
    .current-price {
      font-size: 1.75rem;
    }

    .price-change {
      font-size: 1rem;
    }
    
    .chart-container {
      margin: 0.75rem 0;
      width: 100%;
    }

    footer {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      font-size: 0.75rem;
    }
  }
</style>
