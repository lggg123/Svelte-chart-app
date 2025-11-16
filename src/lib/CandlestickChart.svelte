<script>
  import { onMount, onDestroy } from 'svelte';
  import { candles, patterns } from './stores';

  export let width = 800;
  export let height = 500;

  let canvas;
  let ctx;
  let animationFrame;
  let dpr = 1; // Device pixel ratio for sharp rendering

  // Adjust padding based on canvas size
  $: isMobile = width < 600;
  $: padding = isMobile 
    ? { top: 15, right: 55, bottom: 30, left: 45 }
    : { top: 20, right: 80, bottom: 40, left: 60 };
  
  $: chartWidth = width - padding.left - padding.right;
  $: chartHeight = height - padding.top - padding.bottom;

  onMount(() => {
    // Handle high DPI displays
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    draw();
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  });

  // Redraw when candles, patterns, or dimensions change
  $: if ($candles.length > 0 && ctx) {
    // Update canvas size if dimensions changed
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }
    requestAnimationFrame(draw);
  }

  function draw() {
    if (!ctx || $candles.length === 0) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate scales
    const visibleCandles = $candles.slice(-100); // Show last 100 candles
    const candleWidth = chartWidth / visibleCandles.length;
    
    const prices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    // Draw background grid
    drawGrid(minPrice, maxPrice);

    // Draw volume bars
    drawVolume(visibleCandles, minPrice, maxPrice);

    // Draw candlesticks
    visibleCandles.forEach((candle, i) => {
      const x = padding.left + (i * candleWidth);
      drawCandle(candle, x, candleWidth, minPrice, priceRange);
    });

    // Draw pattern markers
    drawPatterns(visibleCandles, minPrice, priceRange, candleWidth);

    // Draw price axis
    drawPriceAxis(minPrice, maxPrice);

    // Draw current price line
    if (visibleCandles.length > 0) {
      const lastPrice = visibleCandles[visibleCandles.length - 1].close;
      drawPriceLine(lastPrice, minPrice, priceRange);
    }
  }

  function drawGrid(minPrice, maxPrice) {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const priceSteps = 5;
    const priceStep = (maxPrice - minPrice) / priceSteps;
    
    for (let i = 0; i <= priceSteps; i++) {
      const price = minPrice + (i * priceStep);
      const y = padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
      
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }
  }

  function drawVolume(candles, minPrice, maxPrice) {
    const maxVolume = Math.max(...candles.map(c => c.volume));
    const volumeHeight = 50; // Height of volume section
    const volumeY = height - padding.bottom - volumeHeight;

    candles.forEach((candle, i) => {
      const x = padding.left + (i * (chartWidth / candles.length));
      const candleWidth = (chartWidth / candles.length) * 0.8;
      const barHeight = (candle.volume / maxVolume) * volumeHeight;
      
      ctx.fillStyle = candle.close > candle.open 
        ? 'rgba(34, 197, 94, 0.3)'  // Green
        : 'rgba(239, 68, 68, 0.3)';  // Red
      
      ctx.fillRect(x, volumeY + volumeHeight - barHeight, candleWidth, barHeight);
    });
  }

  function drawCandle(candle, x, width, minPrice, priceRange) {
    const bodyWidth = width * 0.7;
    const wickWidth = 2;
    
    // Scale prices to canvas coordinates
    const yScale = (price) => {
      return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const openY = yScale(candle.open);
    const closeY = yScale(candle.close);
    const highY = yScale(candle.high);
    const lowY = yScale(candle.low);

    const isBullish = candle.close > candle.open;
    const color = isBullish ? '#22c55e' : '#ef4444'; // Green or Red

    // Draw wick
    ctx.strokeStyle = color;
    ctx.lineWidth = wickWidth;
    ctx.beginPath();
    ctx.moveTo(x + bodyWidth / 2, highY);
    ctx.lineTo(x + bodyWidth / 2, lowY);
    ctx.stroke();

    // Draw body
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    
    ctx.fillStyle = color;
    ctx.fillRect(x, bodyTop, bodyWidth, Math.max(bodyHeight, 1));
    
    // Add border for hollow candles
    if (!isBullish) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, bodyTop, bodyWidth, Math.max(bodyHeight, 1));
    }
  }

  function drawPatterns(candles, minPrice, priceRange, candleWidth) {
    $patterns.forEach(pattern => {
      // Find candle index for pattern
      const patternTime = new Date(pattern.timestamp).getTime() / 1000;
      const candleIndex = candles.findIndex(c => Math.abs(c.time - patternTime) < 60);
      
      if (candleIndex === -1) return;

      const x = padding.left + (candleIndex * candleWidth) + (candleWidth / 2);
      const y = padding.top + 10;

      // Draw pattern marker
      const emojiSize = isMobile ? '16px' : '20px';
      ctx.font = `${emojiSize} Arial`;
      ctx.textAlign = 'center';
      ctx.fillText(pattern.direction === 'bullish' ? '🟢' : '🔴', x, y);

      // Draw pattern label (skip on very small screens to reduce clutter)
      if (!isMobile || width > 350) {
        const labelSize = isMobile ? '8px' : '10px';
        ctx.font = `${labelSize} Arial`;
        ctx.fillStyle = pattern.direction === 'bullish' ? '#22c55e' : '#ef4444';
        ctx.fillText(pattern.pattern_type, x, y + (isMobile ? 12 : 15));
      }
    });
  }

  function drawPriceAxis(minPrice, maxPrice) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = isMobile ? '10px monospace' : '12px monospace';
    ctx.textAlign = 'left';

    const priceSteps = isMobile ? 4 : 5;
    const priceStep = (maxPrice - minPrice) / priceSteps;
    
    for (let i = 0; i <= priceSteps; i++) {
      const price = minPrice + (i * priceStep);
      const y = padding.top + chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight;
      
      const xOffset = isMobile ? 5 : 10;
      ctx.fillText(`$${price.toFixed(2)}`, padding.left + chartWidth + xOffset, y + 4);
    }
  }

  function drawPriceLine(price, minPrice, priceRange) {
    const y = padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    
    // Draw dashed line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw price label
    const labelWidth = isMobile ? 50 : 60;
    const labelHeight = isMobile ? 18 : 20;
    const fontSize = isMobile ? '10px' : '12px';
    
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(padding.left + chartWidth + 5, y - (labelHeight / 2), labelWidth, labelHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSize} monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`$${price.toFixed(2)}`, padding.left + chartWidth + 5 + (labelWidth / 2), y + 4);
  }
</script>

<canvas
  bind:this={canvas}
  {width}
  {height}
  class="candlestick-chart"
></canvas>

<style>
  .candlestick-chart {
    background: #1a1a1a;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    max-width: 100%;
    height: auto;
    display: block;
    touch-action: pan-x pan-y;
  }

  @media (max-width: 600px) {
    .candlestick-chart {
      border-radius: 8px;
    }
  }
</style>
