<script>
  import { patterns } from './stores';

  // Sort patterns by timestamp, most recent first
  $: sortedPatterns = [...$patterns].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  function getPatternIcon(direction) {
    return direction === 'bullish' ? '🟢' : '🔴';
  }

  function getStars(strength) {
    return '⭐'.repeat(strength);
  }
</script>

{#if sortedPatterns.length > 0}
  <div class="patterns-list">
    <h3>Detected Patterns ({sortedPatterns.length})</h3>
    <div class="patterns-scroll">
      {#each sortedPatterns as pattern (pattern.timestamp + pattern.pattern_type)}
        <div class="pattern-card">
          <div class="pattern-header">
            <span class="pattern-icon">{getPatternIcon(pattern.direction)}</span>
            <span class="pattern-name">{pattern.pattern_type}</span>
          </div>
          <div class="pattern-details">
            <span class="confidence">{Math.round(pattern.confidence * 100)}% confidence</span>
            <span class="strength">{getStars(pattern.strength)}</span>
          </div>
          <div class="pattern-time">{formatTime(pattern.timestamp)}</div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .patterns-list {
    background: #1a1a1a;
    border-radius: 12px;
    padding: 1rem;
    margin-top: 1rem;
  }

  h3 {
    color: white;
    margin-bottom: 1rem;
    font-size: 1.2rem;
  }

  .patterns-scroll {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .patterns-scroll::-webkit-scrollbar {
    height: 6px;
  }

  .patterns-scroll::-webkit-scrollbar-track {
    background: #2a2a2a;
    border-radius: 3px;
  }

  .patterns-scroll::-webkit-scrollbar-thumb {
    background: #3b82f6;
    border-radius: 3px;
  }

  .pattern-card {
    min-width: 200px;
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid transparent;
    transition: all 0.2s;
  }

  .pattern-card:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
  }

  .pattern-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .pattern-icon {
    font-size: 1.5rem;
  }

  .pattern-name {
    color: white;
    font-weight: 600;
    text-transform: capitalize;
  }

  .pattern-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .confidence {
    color: #22c55e;
    font-size: 0.875rem;
  }

  .strength {
    font-size: 0.875rem;
  }

  .pattern-time {
    color: #9ca3af;
    font-size: 0.75rem;
  }
</style>
