<script>
  import { patterns, selectedTimeframe } from './stores';

  let selectedPattern = null;
  let showGuide = false;

  // Analyze multiple patterns to provide decision guidance
  $: patternAnalysis = analyzePatterns($patterns);

  function analyzePatterns(patternList) {
    if (patternList.length === 0) return null;

    const bullishPatterns = patternList.filter(p => p.direction === 'bullish');
    const bearishPatterns = patternList.filter(p => p.direction === 'bearish');

    const avgBullishConfidence = bullishPatterns.length > 0
      ? bullishPatterns.reduce((sum, p) => sum + p.confidence, 0) / bullishPatterns.length
      : 0;
    const avgBearishConfidence = bearishPatterns.length > 0
      ? bearishPatterns.reduce((sum, p) => sum + p.confidence, 0) / bearishPatterns.length
      : 0;

    const highConfidencePatterns = patternList.filter(p => p.confidence >= 0.7);
    const conflictingSignals = bullishPatterns.length > 0 && bearishPatterns.length > 0;

    // Determine overall bias
    let overallBias = 'neutral';
    let biasStrength = 'weak';

    if (bullishPatterns.length > bearishPatterns.length && avgBullishConfidence > avgBearishConfidence) {
      overallBias = 'bullish';
      biasStrength = avgBullishConfidence >= 0.7 ? 'strong' : avgBullishConfidence >= 0.5 ? 'moderate' : 'weak';
    } else if (bearishPatterns.length > bullishPatterns.length && avgBearishConfidence > avgBullishConfidence) {
      overallBias = 'bearish';
      biasStrength = avgBearishConfidence >= 0.7 ? 'strong' : avgBearishConfidence >= 0.5 ? 'moderate' : 'weak';
    } else if (bullishPatterns.length === bearishPatterns.length) {
      // Equal count - use confidence to break tie
      if (avgBullishConfidence > avgBearishConfidence + 0.1) {
        overallBias = 'bullish';
        biasStrength = 'weak';
      } else if (avgBearishConfidence > avgBullishConfidence + 0.1) {
        overallBias = 'bearish';
        biasStrength = 'weak';
      }
    }

    return {
      total: patternList.length,
      bullishCount: bullishPatterns.length,
      bearishCount: bearishPatterns.length,
      avgBullishConfidence,
      avgBearishConfidence,
      highConfidenceCount: highConfidencePatterns.length,
      conflictingSignals,
      overallBias,
      biasStrength,
      highestConfidencePattern: patternList.reduce((max, p) => p.confidence > max.confidence ? p : max, patternList[0])
    };
  }

  function getDecisionGuidance(analysis) {
    if (!analysis) return [];

    const guidance = [];

    // Conflicting signals warning
    if (analysis.conflictingSignals) {
      guidance.push({
        type: 'warning',
        title: 'Conflicting Signals Detected',
        message: `You have ${analysis.bullishCount} bullish and ${analysis.bearishCount} bearish patterns. This indicates market uncertainty - consider waiting for clearer signals or reducing position size.`
      });
    }

    // High confidence pattern highlight
    if (analysis.highConfidenceCount > 0) {
      guidance.push({
        type: 'highlight',
        title: 'High Confidence Patterns',
        message: `${analysis.highConfidenceCount} pattern${analysis.highConfidenceCount > 1 ? 's have' : ' has'} confidence above 70%. These deserve more attention in your analysis.`
      });
    }

    // Overall bias assessment
    if (analysis.overallBias !== 'neutral') {
      const biasText = analysis.biasStrength === 'strong' ? 'Strong' : analysis.biasStrength === 'moderate' ? 'Moderate' : 'Slight';
      guidance.push({
        type: analysis.overallBias,
        title: `${biasText} ${analysis.overallBias.charAt(0).toUpperCase() + analysis.overallBias.slice(1)} Bias`,
        message: analysis.overallBias === 'bullish'
          ? `The patterns suggest upward momentum with ${Math.round(analysis.avgBullishConfidence * 100)}% average confidence.`
          : `The patterns suggest downward pressure with ${Math.round(analysis.avgBearishConfidence * 100)}% average confidence.`
      });
    } else {
      guidance.push({
        type: 'neutral',
        title: 'Mixed Signals - No Clear Direction',
        message: 'The patterns do not show a clear directional bias. Consider staying on the sidelines or using other indicators for confirmation.'
      });
    }

    // Decision framework
    guidance.push({
      type: 'info',
      title: 'Decision Framework',
      message: getDecisionFramework(analysis)
    });

    return guidance;
  }

  function getDecisionFramework(analysis) {
    if (analysis.conflictingSignals && analysis.highConfidenceCount === 0) {
      return 'With conflicting low-confidence signals, the safest approach is to wait. Look for: (1) patterns to resolve in one direction, (2) volume confirmation, or (3) price action breaking key levels.';
    }

    if (analysis.conflictingSignals && analysis.highConfidenceCount > 0) {
      return `Focus on the high-confidence ${analysis.highestConfidencePattern.direction} ${analysis.highestConfidencePattern.pattern_type} pattern (${Math.round(analysis.highestConfidencePattern.confidence * 100)}%). Use tighter stops due to conflicting signals.`;
    }

    if (analysis.biasStrength === 'strong') {
      return `Multiple patterns align ${analysis.overallBias}. This is a higher probability setup. Consider: (1) entering with normal position size, (2) setting stops beyond recent swing points, (3) taking partial profits at key levels.`;
    }

    if (analysis.biasStrength === 'moderate') {
      return `Patterns lean ${analysis.overallBias} but aren't unanimous. Consider: (1) waiting for one more confirming pattern, (2) entering with reduced size, or (3) using the highest confidence pattern as your primary signal.`;
    }

    return 'With weak or mixed signals, prioritize capital preservation. Only trade if you see additional confirmation from volume, support/resistance, or other technical indicators.';
  }

  function toggleGuide() {
    showGuide = !showGuide;
  }

  // Get human-readable timeframe label with short/long term context
  function getTimeframeLabel(tf) {
    const labels = {
      '1m': { label: '1 Minute', term: 'Very Short-Term', type: 'intraday' },
      '5m': { label: '5 Minutes', term: 'Short-Term', type: 'intraday' },
      '15m': { label: '15 Minutes', term: 'Short-Term', type: 'intraday' },
      '1h': { label: '1 Hour', term: 'Short-Term', type: 'intraday' },
      '4h': { label: '4 Hours', term: 'Medium-Term', type: 'swing' },
      '1d': { label: '1 Day', term: 'Medium-Term', type: 'swing' },
      '1w': { label: '1 Week', term: 'Long-Term', type: 'position' }
    };
    return labels[tf] || { label: tf, term: 'Unknown', type: 'unknown' };
  }

  // Get timeframe-specific trading advice
  function getTimeframeAdvice(tf) {
    const tfInfo = getTimeframeLabel(tf);
    const advice = {
      'intraday': 'These patterns are best for day trading. Signals may change quickly - monitor closely and use tight stop-losses.',
      'swing': 'These patterns are suitable for swing trading (days to weeks). Allow time for the pattern to play out.',
      'position': 'These patterns indicate longer-term trends. Best for position trading with wider stop-losses and longer holding periods.'
    };
    return advice[tfInfo.type] || 'Monitor the pattern based on your trading timeframe.';
  }

  // Sort patterns by timestamp, most recent first
  $: sortedPatterns = [...$patterns].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function getPatternIcon(direction) {
    return direction === 'bullish' ? '🟢' : '🔴';
  }

  function getStars(strength) {
    return '⭐'.repeat(strength || 1);
  }

  function openPatternDetails(pattern) {
    selectedPattern = pattern;
  }

  function closePatternDetails() {
    selectedPattern = null;
  }

  function getPatternExplanation(patternType, direction) {
    const explanations = {
      'doji': {
        bullish: 'A Doji pattern suggests market indecision. In an uptrend, it may signal a potential reversal. The opening and closing prices are nearly equal.',
        bearish: 'A Doji pattern suggests market indecision. In a downtrend, it may signal a potential reversal upward. The opening and closing prices are nearly equal.'
      },
      'hammer': {
        bullish: 'A Hammer is a strong bullish reversal pattern. It forms after a decline and signals that buyers are stepping in. The long lower shadow shows rejection of lower prices.',
        bearish: 'An inverted Hammer can signal bearish pressure. Despite the lower shadow, the market closed near the low, showing sellers are in control.'
      },
      'shooting star': {
        bullish: 'A Shooting Star at the bottom can indicate a potential reversal. The long upper shadow shows buyers attempted to push higher but failed.',
        bearish: 'A Shooting Star is a bearish reversal pattern. It forms after an uptrend and signals that sellers are taking control. The long upper shadow shows rejection of higher prices.'
      },
      'engulfing': {
        bullish: 'A Bullish Engulfing pattern occurs when a large green candle completely engulfs the previous red candle. This signals strong buying pressure and potential trend reversal.',
        bearish: 'A Bearish Engulfing pattern occurs when a large red candle completely engulfs the previous green candle. This signals strong selling pressure and potential trend reversal.'
      },
      'morning star': {
        bullish: 'A Morning Star is a three-candle bullish reversal pattern. It signals the end of a downtrend and the beginning of an uptrend. Very reliable when confirmed.',
        bearish: 'This variation suggests caution despite the pattern name. Wait for confirmation before acting.'
      },
      'evening star': {
        bullish: 'Despite the pattern name, this suggests waiting for more confirmation before taking action.',
        bearish: 'An Evening Star is a three-candle bearish reversal pattern. It signals the end of an uptrend and potential downturn. Very reliable when confirmed.'
      },
      'three white soldiers': {
        bullish: 'Three White Soldiers is a strong bullish pattern showing three consecutive green candles with higher closes. Indicates strong buying momentum.',
        bearish: 'Unexpected bearish signal with this pattern. Exercise caution and wait for confirmation.'
      },
      'three black crows': {
        bullish: 'Unexpected bullish signal with this pattern. Exercise caution and wait for confirmation.',
        bearish: 'Three Black Crows is a strong bearish pattern showing three consecutive red candles with lower closes. Indicates strong selling momentum.'
      }
    };

    const key = patternType.toLowerCase();
    const dir = direction === 'bullish' ? 'bullish' : 'bearish';
    
    return explanations[key]?.[dir] || 
           `A ${patternType} pattern has been detected with a ${direction} signal. This suggests potential price movement in the ${direction} direction.`;
  }

  function getTradingAdvice(direction, confidence) {
    const conf = Math.round(confidence * 100);
    
    if (direction === 'bullish') {
      if (conf >= 80) {
        return '💡 Strong buy signal. Consider entering a long position with proper risk management.';
      } else if (conf >= 60) {
        return '💡 Moderate buy signal. Wait for confirmation before entering.';
      } else {
        return '💡 Weak signal. Monitor for additional confirmation signals.';
      }
    } else {
      if (conf >= 80) {
        return '💡 Strong sell signal. Consider taking profits or entering a short position.';
      } else if (conf >= 60) {
        return '💡 Moderate sell signal. Consider reducing exposure or wait for confirmation.';
      } else {
        return '💡 Weak signal. Monitor for additional confirmation signals.';
      }
    }
  }
</script>

{#if sortedPatterns.length > 0}
  {@const tfInfo = getTimeframeLabel($selectedTimeframe)}
  <div class="patterns-list">
    <div class="patterns-header">
      <h3>📊 Detected Patterns ({sortedPatterns.length})</h3>
      <div class="timeframe-badge {tfInfo.type}">
        <span class="tf-label">{tfInfo.label}</span>
        <span class="tf-term">{tfInfo.term}</span>
      </div>
    </div>
    <div class="patterns-scroll">
      {#each sortedPatterns as pattern (pattern.timestamp + pattern.pattern_type)}
        <button
          class="pattern-card"
          on:click={() => openPatternDetails(pattern)}
        >
          <div class="pattern-header">
            <span class="pattern-icon">{getPatternIcon(pattern.direction)}</span>
            <span class="pattern-name">{pattern.pattern_type}</span>
          </div>
          <div class="timeframe-indicator {tfInfo.type}">
            {tfInfo.term}
          </div>
          <div class="pattern-details">
            <span class="confidence">{Math.round(pattern.confidence * 100)}% confident</span>
            <span class="strength">{getStars(pattern.strength)}</span>
          </div>
          <div class="pattern-time">{formatTime(pattern.timestamp)}</div>
          <div class="learn-more">
            (Click to understand)
          </div>
        </button>
      {/each}
    </div>

    {#if sortedPatterns.length > 1}
      <button class="decision-guide-toggle" on:click={toggleGuide}>
        {showGuide ? '▼' : '▶'} How to Interpret Multiple Patterns
      </button>

      {#if showGuide && patternAnalysis}
        <div class="decision-guide">
          <div class="guide-header">
            <h4>Pattern Analysis Summary</h4>
          </div>

          <div class="pattern-summary">
            <div class="summary-stat">
              <span class="stat-value bullish">{patternAnalysis.bullishCount}</span>
              <span class="stat-label">Bullish</span>
              {#if patternAnalysis.bullishCount > 0}
                <span class="stat-confidence">Avg: {Math.round(patternAnalysis.avgBullishConfidence * 100)}%</span>
              {/if}
            </div>
            <div class="summary-divider">vs</div>
            <div class="summary-stat">
              <span class="stat-value bearish">{patternAnalysis.bearishCount}</span>
              <span class="stat-label">Bearish</span>
              {#if patternAnalysis.bearishCount > 0}
                <span class="stat-confidence">Avg: {Math.round(patternAnalysis.avgBearishConfidence * 100)}%</span>
              {/if}
            </div>
          </div>

          <div class="guidance-cards">
            {#each getDecisionGuidance(patternAnalysis) as item}
              <div class="guidance-card {item.type}">
                <div class="guidance-title">
                  {#if item.type === 'warning'}
                    <span class="guidance-icon">⚠️</span>
                  {:else if item.type === 'highlight'}
                    <span class="guidance-icon">⭐</span>
                  {:else if item.type === 'bullish'}
                    <span class="guidance-icon">📈</span>
                  {:else if item.type === 'bearish'}
                    <span class="guidance-icon">📉</span>
                  {:else if item.type === 'neutral'}
                    <span class="guidance-icon">⚖️</span>
                  {:else}
                    <span class="guidance-icon">💡</span>
                  {/if}
                  {item.title}
                </div>
                <div class="guidance-message">{item.message}</div>
              </div>
            {/each}
          </div>

          <div class="guide-footer">
            <p class="guide-disclaimer">
              This analysis is for educational purposes only. Always combine pattern analysis with other technical indicators,
              fundamental analysis, and proper risk management before making trading decisions.
            </p>
          </div>
        </div>
      {/if}
    {/if}
  </div>
{/if}

{#if selectedPattern}
  {@const modalTfInfo = getTimeframeLabel($selectedTimeframe)}
  <div
    class="pattern-modal-overlay"
    on:click={closePatternDetails}
    on:keydown={(e) => e.key === 'Escape' && closePatternDetails()}
    role="button"
    tabindex="0"
  >
    <div
      class="pattern-modal"
      on:click|stopPropagation
      on:keydown|stopPropagation
      role="dialog"
      aria-modal="true"
      tabindex="-1"
    >
      <div class="modal-header">
        <div class="modal-title">
          <span class="modal-icon">{getPatternIcon(selectedPattern.direction)}</span>
          <h3>{selectedPattern.pattern_type}</h3>
        </div>
        <button class="close-btn" on:click={closePatternDetails}>✕</button>
      </div>

      <div class="modal-content">
        <div class="timeframe-context-section {modalTfInfo.type}">
          <div class="tf-context-header">
            <span class="tf-clock">🕐</span>
            <span class="tf-context-label">{modalTfInfo.term} Pattern</span>
          </div>
          <div class="tf-context-detail">
            Detected on <strong>{modalTfInfo.label}</strong> chart
          </div>
        </div>

        <div class="info-section">
          <div class="info-label">Signal Type</div>
          <div class="info-value {selectedPattern.direction}">
            {selectedPattern.direction === 'bullish' ? '📈 Bullish (Upward)' : '📉 Bearish (Downward)'}
          </div>
        </div>

        <div class="info-section">
          <div class="info-label">Confidence Level</div>
          <div class="confidence-bar-container">
            <div class="confidence-bar" style="width: {Math.round(selectedPattern.confidence * 100)}%"></div>
            <span class="confidence-text">{Math.round(selectedPattern.confidence * 100)}%</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-label">Pattern Strength</div>
          <div class="info-value">
            {getStars(selectedPattern.strength)} ({selectedPattern.strength || 1}/5)
          </div>
        </div>

        <div class="info-section">
          <div class="info-label">Detected At</div>
          <div class="info-value">{formatTime(selectedPattern.timestamp)}</div>
        </div>

        <div class="explanation-section">
          <h4>📖 What does this mean?</h4>
          <p>{getPatternExplanation(selectedPattern.pattern_type, selectedPattern.direction)}</p>
        </div>

        <div class="timeframe-advice-section">
          <h4>⏱️ Timeframe Context</h4>
          <p>{getTimeframeAdvice($selectedTimeframe)}</p>
        </div>

        <div class="advice-section">
          <h4>💼 Trading Consideration</h4>
          <p>{getTradingAdvice(selectedPattern.direction, selectedPattern.confidence)}</p>
          <p class="disclaimer">⚠️ Always use stop-losses and never risk more than you can afford to lose.</p>
        </div>
      </div>
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
    min-width: 220px;
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
    border: 2px solid transparent;
    transition: all 0.2s;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
  }

  .pattern-card:hover {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
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
    margin-bottom: 0.5rem;
  }

  .learn-more {
    color: #3b82f6;
    font-size: 0.75rem;
    font-style: italic;
    margin-top: 0.5rem;
  }

  /* Decision Guide Styles */
  .decision-guide-toggle {
    width: 100%;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    color: #3b82f6;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
    text-align: left;
    transition: all 0.2s;
  }

  .decision-guide-toggle:hover {
    background: #333;
    border-color: #3b82f6;
  }

  .decision-guide {
    background: #222;
    border: 1px solid #3a3a3a;
    border-radius: 12px;
    padding: 1.25rem;
    margin-top: 0.75rem;
  }

  .guide-header h4 {
    color: white;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pattern-summary {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    background: #1a1a1a;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .summary-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
  }

  .stat-value.bullish {
    color: #22c55e;
  }

  .stat-value.bearish {
    color: #ef4444;
  }

  .stat-label {
    color: #9ca3af;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-confidence {
    color: #6b7280;
    font-size: 0.75rem;
  }

  .summary-divider {
    color: #4b5563;
    font-size: 1rem;
    font-weight: 600;
  }

  .guidance-cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .guidance-card {
    background: #2a2a2a;
    border-radius: 8px;
    padding: 1rem;
    border-left: 4px solid #3a3a3a;
  }

  .guidance-card.warning {
    border-left-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .guidance-card.highlight {
    border-left-color: #eab308;
    background: rgba(234, 179, 8, 0.1);
  }

  .guidance-card.bullish {
    border-left-color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
  }

  .guidance-card.bearish {
    border-left-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .guidance-card.neutral {
    border-left-color: #6b7280;
    background: rgba(107, 114, 128, 0.1);
  }

  .guidance-card.info {
    border-left-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .guidance-title {
    color: white;
    font-weight: 600;
    font-size: 0.95rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .guidance-icon {
    font-size: 1.1rem;
  }

  .guidance-message {
    color: #d1d5db;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .guide-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #3a3a3a;
  }

  .guide-disclaimer {
    color: #6b7280;
    font-size: 0.75rem;
    font-style: italic;
    margin: 0;
    line-height: 1.5;
  }

  /* Patterns Header with Timeframe Badge */
  .patterns-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .patterns-header h3 {
    margin-bottom: 0;
  }

  .timeframe-badge {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
  }

  .timeframe-badge.intraday {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .timeframe-badge.swing {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .timeframe-badge.position {
    border-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
  }

  .tf-label {
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .tf-term {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timeframe-badge.intraday .tf-term {
    color: #f59e0b;
  }

  .timeframe-badge.swing .tf-term {
    color: #3b82f6;
  }

  .timeframe-badge.position .tf-term {
    color: #8b5cf6;
  }

  /* Timeframe indicator on pattern cards */
  .timeframe-indicator {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .timeframe-indicator.intraday {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  .timeframe-indicator.swing {
    background: rgba(59, 130, 246, 0.2);
    color: #3b82f6;
  }

  .timeframe-indicator.position {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }

  /* Modal Styles */
  .pattern-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }

  .pattern-modal {
    background: #1a1a1a;
    border-radius: 16px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid #2a2a2a;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 2px solid #2a2a2a;
  }

  .modal-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .modal-icon {
    font-size: 2rem;
  }

  .modal-title h3 {
    margin: 0;
    font-size: 1.5rem;
    color: white;
    text-transform: capitalize;
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

  .modal-content {
    padding: 1.5rem;
  }

  .info-section {
    margin-bottom: 1.5rem;
  }

  .info-label {
    color: #9ca3af;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .info-value {
    color: white;
    font-size: 1.125rem;
    font-weight: 500;
  }

  .info-value.bullish {
    color: #22c55e;
  }

  .info-value.bearish {
    color: #ef4444;
  }

  .confidence-bar-container {
    position: relative;
    width: 100%;
    height: 32px;
    background: #2a2a2a;
    border-radius: 8px;
    overflow: hidden;
  }

  .confidence-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #22c55e);
    transition: width 0.3s ease;
    border-radius: 8px;
  }

  .confidence-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .explanation-section,
  .advice-section,
  .timeframe-advice-section {
    background: #2a2a2a;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  .explanation-section h4,
  .advice-section h4,
  .timeframe-advice-section h4 {
    color: white;
    font-size: 1.125rem;
    margin: 0 0 0.75rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .explanation-section p,
  .advice-section p,
  .timeframe-advice-section p {
    color: #e5e7eb;
    line-height: 1.6;
    margin: 0;
  }

  .advice-section p {
    margin-bottom: 1rem;
  }

  .advice-section p:last-child {
    margin-bottom: 0;
  }

  /* Timeframe Context Section in Modal */
  .timeframe-context-section {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    background: #2a2a2a;
    border-left: 4px solid #3a3a3a;
  }

  .timeframe-context-section.intraday {
    border-left-color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
  }

  .timeframe-context-section.swing {
    border-left-color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
  }

  .timeframe-context-section.position {
    border-left-color: #8b5cf6;
    background: rgba(139, 92, 246, 0.1);
  }

  .tf-context-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .tf-clock {
    font-size: 1.25rem;
  }

  .tf-context-label {
    font-weight: 700;
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timeframe-context-section.intraday .tf-context-label {
    color: #f59e0b;
  }

  .timeframe-context-section.swing .tf-context-label {
    color: #3b82f6;
  }

  .timeframe-context-section.position .tf-context-label {
    color: #8b5cf6;
  }

  .tf-context-detail {
    color: #9ca3af;
    font-size: 0.875rem;
  }

  .tf-context-detail strong {
    color: white;
  }

  .disclaimer {
    color: #fbbf24 !important;
    font-size: 0.875rem;
    font-style: italic;
    background: rgba(251, 191, 36, 0.1);
    padding: 0.75rem;
    border-radius: 8px;
    border-left: 3px solid #fbbf24;
  }

  /* Mobile Styles */
  @media (max-width: 600px) {
    .patterns-list {
      padding: 0.75rem;
      margin-top: 0.75rem;
    }

    h3 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
    }

    .patterns-scroll {
      gap: 0.75rem;
      padding-bottom: 0.75rem;
    }

    .pattern-card {
      min-width: 200px;
      padding: 0.75rem;
    }

    .pattern-icon {
      font-size: 1.25rem;
    }

    .pattern-name {
      font-size: 0.9rem;
    }

    .confidence,
    .strength {
      font-size: 0.8rem;
    }

    .pattern-time {
      font-size: 0.7rem;
    }

    .learn-more {
      font-size: 0.7rem;
    }

    /* Mobile timeframe styles */
    .patterns-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .timeframe-badge {
      align-items: flex-start;
      padding: 0.4rem 0.6rem;
    }

    .tf-label {
      font-size: 0.8rem;
    }

    .tf-term {
      font-size: 0.6rem;
    }

    .timeframe-indicator {
      font-size: 0.6rem;
      padding: 0.15rem 0.4rem;
    }

    .timeframe-context-section {
      padding: 0.75rem;
      margin-bottom: 1rem;
    }

    .tf-clock {
      font-size: 1rem;
    }

    .tf-context-label {
      font-size: 0.875rem;
    }

    .tf-context-detail {
      font-size: 0.75rem;
    }

    .timeframe-advice-section h4 {
      font-size: 1rem;
    }

    .timeframe-advice-section p {
      font-size: 0.9rem;
    }

    /* Mobile decision guide styles */
    .decision-guide-toggle {
      font-size: 0.8rem;
      padding: 0.6rem 0.75rem;
    }

    .decision-guide {
      padding: 1rem;
    }

    .guide-header h4 {
      font-size: 1rem;
    }

    .pattern-summary {
      gap: 1rem;
      padding: 0.75rem;
    }

    .stat-value {
      font-size: 1.5rem;
    }

    .stat-label {
      font-size: 0.7rem;
    }

    .stat-confidence {
      font-size: 0.65rem;
    }

    .guidance-card {
      padding: 0.75rem;
    }

    .guidance-title {
      font-size: 0.85rem;
    }

    .guidance-message {
      font-size: 0.8rem;
    }

    .guide-disclaimer {
      font-size: 0.7rem;
    }

    .pattern-modal-overlay {
      padding: 0;
    }

    .pattern-modal {
      border-radius: 0;
      max-height: 100vh;
      height: 100vh;
    }

    .modal-header {
      padding: 1rem;
    }

    .modal-icon {
      font-size: 1.5rem;
    }

    .modal-title h3 {
      font-size: 1.25rem;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      font-size: 1.25rem;
    }

    .modal-content {
      padding: 1rem;
    }

    .info-label {
      font-size: 0.75rem;
    }

    .info-value {
      font-size: 1rem;
    }

    .explanation-section h4,
    .advice-section h4 {
      font-size: 1rem;
    }

    .explanation-section p,
    .advice-section p {
      font-size: 0.9rem;
    }
  }
</style>
