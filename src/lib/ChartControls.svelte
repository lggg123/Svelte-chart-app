<script>
  import { selectedTimeframe } from './stores';

  const timeframes = [
    { value: '1m', label: '1M' },
    { value: '5m', label: '5M' },
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' }
  ];

  export let showVolume = true;
  export let showMA = false;
  export let indicatorsBelow = false;

  function handleTimeframeChange(tf) {
    selectedTimeframe.set(tf);
  }
</script>

<div class="controls">
  <!-- Timeframe selector -->
  <div class="timeframe-buttons">
    {#each timeframes as tf}
      <button
        class="tf-btn"
        class:active={$selectedTimeframe === tf.value}
        on:click={() => handleTimeframeChange(tf.value)}
      >
        {tf.label}
      </button>
    {/each}
  </div>

  {#if !indicatorsBelow}
    <!-- Indicator toggles (default position) -->
    <div class="indicators">
      <label>
        <input type="checkbox" bind:checked={showVolume} />
        Volume
      </label>
      <label>
        <input type="checkbox" bind:checked={showMA} />
        Moving Averages
      </label>
    </div>
  {/if}
</div>

{#if indicatorsBelow}
  <div class="indicators indicators-below">
    <label>
      <input type="checkbox" bind:checked={showVolume} />
      Volume
    </label>
    <label>
      <input type="checkbox" bind:checked={showMA} />
      Moving Averages
    </label>
  </div>
{/if}

<style>
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #1a1a1a;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .timeframe-buttons {
    display: flex;
    gap: 0.5rem;
  }

  .tf-btn {
    padding: 0.5rem 1rem;
    background: #2a2a2a;
    color: #9ca3af;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }

  .tf-btn:hover {
    background: #3a3a3a;
  }

  .tf-btn.active {
    background: #3b82f6;
    color: white;
  }

  .indicators {
    display: flex;
    gap: 1rem;
  }

  @media (max-width: 600px) {
    .controls {
      flex-direction: column;
      align-items: stretch;
      padding: 0.5rem;
    }
    .indicators {
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    .indicators-below {
      margin-top: 0.5rem;
      margin-bottom: 0.5rem;
      justify-content: flex-start;
    }
    label {
      font-size: 0.9rem;
      gap: 0.3rem;
    }
    input[type="checkbox"] {
      width: 1rem;
      height: 1rem;
    }
  }

  label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #9ca3af;
    cursor: pointer;
  }

  input[type="checkbox"] {
    cursor: pointer;
  }
</style>
