<script>
  import { onMount } from 'svelte';
  import { selectedSymbol } from './stores';
  import { api } from './api';

  export let onClose;

  let stocks = [];
  let loading = true;
  let error = null;
  let searchQuery = '';
  let sortBy = 'volume'; // volume, gainers, losers, alphabetical

  onMount(async () => {
    await loadStocks();
  });

  async function loadStocks() {
    try {
      loading = true;
      error = null;
      const data = await api.getTopPicks(100);
      stocks = data.stocks || data || [];
    } catch (err) {
      error = err.message;
      console.error('Failed to load stocks:', err);
    } finally {
      loading = false;
    }
  }

  function selectStock(symbol) {
    selectedSymbol.set(symbol);
    if (onClose) onClose();
  }

  $: filteredStocks = stocks.filter(stock => 
    stock.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: sortedStocks = [...filteredStocks].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return (b.volume || 0) - (a.volume || 0);
      case 'gainers':
        return (b.change_percent || 0) - (a.change_percent || 0);
      case 'losers':
        return (a.change_percent || 0) - (b.change_percent || 0);
      case 'alphabetical':
        return (a.symbol || '').localeCompare(b.symbol || '');
      default:
        return 0;
    }
  });

  function formatVolume(vol) {
    if (!vol) return 'N/A';
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toString();
  }
</script>

<div class="stock-list-overlay" on:click={onClose} on:keydown={(e) => e.key === 'Escape' && onClose()} role="button" tabindex="0">
  <div class="stock-list-modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
    <!-- Header -->
    <div class="modal-header">
      <h2>📈 Stock Screener</h2>
      <button class="close-btn" on:click={onClose}>✕</button>
    </div>

    <!-- Search and Filters -->
    <div class="controls-bar">
      <input
        type="text"
        class="search-input"
        placeholder="Search stocks..."
        bind:value={searchQuery}
      />
      
      <select class="sort-select" bind:value={sortBy}>
        <option value="volume">Volume</option>
        <option value="gainers">Top Gainers</option>
        <option value="losers">Top Losers</option>
        <option value="alphabetical">A-Z</option>
      </select>
    </div>

    <!-- Stock List -->
    <div class="stock-list-content">
      {#if loading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading stocks...</p>
        </div>
      {:else if error}
        <div class="error">
          <p>❌ {error}</p>
          <button on:click={loadStocks}>Retry</button>
        </div>
      {:else if sortedStocks.length === 0}
        <div class="empty">
          <p>No stocks found</p>
        </div>
      {:else}
        <div class="stock-grid">
          {#each sortedStocks as stock}
            <div 
              class="stock-card" 
              on:click={() => selectStock(stock.symbol)}
              on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectStock(stock.symbol)}
              role="button"
              tabindex="0"
            >
              <div class="stock-header">
                <span class="stock-symbol">{stock.symbol}</span>
                <span class="stock-price">${(stock.price || 0).toFixed(2)}</span>
              </div>
              
              {#if stock.name}
                <div class="stock-name">{stock.name}</div>
              {/if}
              
              <div class="stock-stats">
                <div class="stat">
                  <span class="stat-label">Change</span>
                  <span class="stat-value" class:positive={stock.change_percent >= 0} class:negative={stock.change_percent < 0}>
                    {stock.change_percent >= 0 ? '+' : ''}{(stock.change_percent || 0).toFixed(2)}%
                  </span>
                </div>
                
                <div class="stat">
                  <span class="stat-label">Volume</span>
                  <span class="stat-value">{formatVolume(stock.volume)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .stock-list-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .stock-list-modal {
    background: #1a1a1a;
    border-radius: 16px;
    width: 100%;
    max-width: 1200px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid #2a2a2a;
  }

  .modal-header h2 {
    margin: 0;
    font-size: 1.75rem;
    color: white;
  }

  .close-btn {
    background: #2a2a2a;
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: #3a3a3a;
    transform: rotate(90deg);
  }

  .controls-bar {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 2px solid #2a2a2a;
  }

  .search-input {
    flex: 1;
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border: 2px solid #3a3a3a;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .sort-select {
    padding: 0.75rem 1rem;
    background: #2a2a2a;
    border: 2px solid #3a3a3a;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    min-width: 150px;
  }

  .sort-select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .stock-list-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
  }

  .stock-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .stock-card {
    background: #2a2a2a;
    border-radius: 12px;
    padding: 1.25rem;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .stock-card:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }

  .stock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .stock-symbol {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
  }

  .stock-price {
    font-size: 1.125rem;
    font-weight: 600;
    color: #3b82f6;
  }

  .stock-name {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-bottom: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .stock-stats {
    display: flex;
    gap: 1rem;
  }

  .stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
  }

  .stat-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: #e5e7eb;
  }

  .stat-value.positive {
    color: #22c55e;
  }

  .stat-value.negative {
    color: #ef4444;
  }

  .loading,
  .error,
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #9ca3af;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #2a2a2a;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .error button:hover {
    background: #2563eb;
  }

  /* Mobile Styles */
  @media (max-width: 600px) {
    .stock-list-overlay {
      padding: 0;
    }

    .stock-list-modal {
      border-radius: 0;
      max-height: 100vh;
      height: 100vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-header h2 {
      font-size: 1.25rem;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      font-size: 1.25rem;
    }

    .controls-bar {
      flex-direction: column;
      padding: 1rem;
      gap: 0.75rem;
    }

    .sort-select {
      min-width: 100%;
    }

    .stock-list-content {
      padding: 1rem;
    }

    .stock-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .stock-card {
      padding: 1rem;
    }

    .stock-symbol {
      font-size: 1.125rem;
    }

    .stock-price {
      font-size: 1rem;
    }
  }
</style>
