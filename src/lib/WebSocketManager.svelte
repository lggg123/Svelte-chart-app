<script>
  import { onMount, onDestroy } from 'svelte';
  import { candles, patterns, currentPrice, isConnected, selectedSymbol, selectedTimeframe } from './stores';
  import { api } from './api';

  let ws = null;
  let reconnectTimeout = null;

  function connect() {
    const symbol = $selectedSymbol;
    const timeframe = $selectedTimeframe;
    
    try {
      ws = api.createWebSocket(symbol, timeframe);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected for ${symbol} (${timeframe})`);
        isConnected.set(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        isConnected.set(false);
      };
      
      ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected:', event.code, event.reason);
        isConnected.set(false);
        
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => {
          console.log('🔄 Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      isConnected.set(false);
    }
  }

  function handleMessage(data) {
    switch (data.type) {
      case 'historical':
        // Initial historical data
        candles.set(data.data.map(formatCandle));
        break;
        
      case 'candle_update':
        // Update or append candle
        const newCandle = formatCandle(data.data);
        candles.update(c => {
          const lastCandle = c[c.length - 1];
          if (lastCandle && lastCandle.time === newCandle.time) {
            // Update existing candle
            c[c.length - 1] = newCandle;
            return [...c];
          } else {
            // New candle
            const updated = [...c, newCandle];
            // Keep only last 500 candles for performance
            return updated.length > 500 ? updated.slice(-500) : updated;
          }
        });
        currentPrice.set(newCandle.close);
        break;
        
      case 'pattern_detected':
        // New pattern detected
        const pattern = data.data;
        patterns.update(p => [...p, pattern]);
        showNotification(pattern);
        break;
        
      case 'heartbeat':
        // Keep-alive
        break;
    }
  }

  function formatCandle(raw) {
    return {
      time: new Date(raw.timestamp).getTime() / 1000,
      open: raw.open,
      high: raw.high,
      low: raw.low,
      close: raw.close,
      volume: raw.volume
    };
  }

  function showNotification(pattern) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${pattern.pattern_type} detected!`, {
        body: `${pattern.direction} pattern with ${Math.round(pattern.confidence * 100)}% confidence`,
        icon: '/chart-icon.png'
      });
    }
  }

  function disconnect() {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
  }

  onMount(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    connect();
  });

  onDestroy(() => {
    disconnect();
  });

  // Reconnect when symbol or timeframe changes
  $: {
    if ($selectedSymbol || $selectedTimeframe) {
      disconnect();
      candles.set([]);
      patterns.set([]);
      connect();
    }
  }
</script>

<!-- This component has no visible output, just manages WebSocket -->
