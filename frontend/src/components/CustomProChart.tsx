import { useEffect, useRef, useState } from 'react';
import type { SymbolInfo, Period, DatafeedSubscribeCallback } from '@klinecharts/pro';
import { KLineChartPro } from '@klinecharts/pro';
import '@klinecharts/pro/dist/klinecharts-pro.css';
import WebSocketService from '../services/WebSocketService';

// Define KLineData type locally because it is not exported by @klinecharts/pro
export interface KLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  turnover?: number;
}

// Define WSKLineData type to match the WebSocketService data structure
export interface WSKLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  turnover?: number;
}

class BinanceDatafeed {
  private callback: DatafeedSubscribeCallback | null = null;
  private currentSymbol: string = '';
  private currentInterval: string = '1m';

  searchSymbols(search?: string): Promise<SymbolInfo[]> {
    return fetch('http://localhost/api/symbols')
      .then(res => res.json())
      .catch(() => [
        { ticker: 'BTCUSDT', name: 'Bitcoin', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' },
        { ticker: 'ETHUSDT', name: 'Ethereum', exchange: 'Binance', market: 'crypto', priceCurrency: 'USDT', type: 'crypto' }
      ]);
  }

  async getHistoryKLineData(symbol: SymbolInfo, period: Period, from: number, to: number): Promise<KLineData[]> {
    try {
      const interval = this.periodToInterval(period);
      console.log(`📈 Fetching historical data for ${symbol.ticker} ${interval}`);
      
      const response = await fetch(
        `http://localhost/api/history/${symbol.ticker}?interval=${interval}&limit=1000`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const wsData: WSKLineData[] = await response.json();
      console.log(`✅ Received ${wsData.length} historical bars for ${symbol.ticker}`);
      
      // Convert WSKLineData to KLineData format
      return wsData.map(this.convertToKLineData);
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      return [];
    }
  }

  subscribe(symbol: SymbolInfo, period: Period, callback: DatafeedSubscribeCallback): void {
    console.log(`🔄 Subscribing to ${symbol.ticker} ${this.periodToInterval(period)}`);
    
    // Lưu callback
    this.callback = callback;
    
    // Unsubscribe từ symbol cũ nếu có và KHÁC symbol mới
    if (this.currentSymbol && (this.currentSymbol !== symbol.ticker || this.currentInterval !== this.periodToInterval(period))) {
      console.log(`🔌 Unsubscribing from old: ${this.currentSymbol} ${this.currentInterval}`);
      WebSocketService.unsubscribe(this.currentSymbol, this.currentInterval);
    }

    // Update current symbol và interval
    const newInterval = this.periodToInterval(period);
    this.currentSymbol = symbol.ticker;
    this.currentInterval = newInterval;

    // Connect nếu chưa connected
    if (!WebSocketService.isConnected()) {
      console.log('🔗 Connecting to WebSocket...');
      WebSocketService.connect();
    }

    // Subscribe ngay lập tức (không setTimeout)
    WebSocketService.subscribe(
      symbol.ticker,
      newInterval,
      (wsData: WSKLineData) => {
        console.log(`📊 REALTIME UPDATE for ${symbol.ticker} ${newInterval}:`, {
          time: new Date(wsData.timestamp).toLocaleTimeString(),
          price: wsData.close,
          volume: wsData.volume
        });
        
        // Convert và gọi callback ngay lập tức
        const convertedData = this.convertToKLineData(wsData);
        
        if (this.callback) {
          this.callback(convertedData);
          console.log(`✅ Chart UPDATED with live price: $${wsData.close}`);
        } else {
          console.warn('⚠️ No callback available for chart update');
        }
      },
      (historicalData: WSKLineData[]) => {
        console.log(`📈 Historical data loaded for ${symbol.ticker}: ${historicalData.length} bars`);
      }
    );
  }

  unsubscribe(): void {
    console.log(`🔌 Unsubscribing from ${this.currentSymbol} ${this.currentInterval}`);
    if (this.currentSymbol) {
      WebSocketService.unsubscribe(this.currentSymbol, this.currentInterval);
    }
    this.callback = null;
    this.currentSymbol = '';
    this.currentInterval = '1m';
  }

  // Helper method để convert từ WSKLineData sang KLineData
  private convertToKLineData(wsData: WSKLineData): KLineData {
    return {
      timestamp: wsData.timestamp,
      open: wsData.open,
      high: wsData.high,
      low: wsData.low,
      close: wsData.close,
      volume: wsData.volume || 0, // Provide default value if undefined
      turnover: wsData.turnover
    };
  }

  private periodToInterval(period: Period): string {
    const map: Record<string, string> = {
      '1minute': '1m',
      '5minute': '5m',
      '15minute': '15m',
      '30minute': '30m',
      '1hour': '1h',
      '4hour': '4h',
      '1day': '1d',
      '1week': '1w'
    };
    const result = map[`${period.multiplier}${period.timespan}`] || '1m';
    console.log(`🔄 Period ${period.multiplier}${period.timespan} mapped to ${result}`);
    return result;
  }
}

interface ChartProps {
  symbol?: string;
  interval?: string;
  width?: string;
  height?: string;
}

export default function CustomProChart({ 
  symbol = 'BTCUSDT', 
  interval = '1m',
  width = '100%',
  height = '600px'
}: ChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<KLineChartPro | null>(null);
  const datafeedRef = useRef<BinanceDatafeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);
  
  // Realtime price states
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const previousPriceRef = useRef<number | null>(null);

  // Helper function để convert interval string sang Period
  const intervalToPeriod = (interval: string): Period => {
    const map: Record<string, Period> = {
      '1m': { multiplier: 1, timespan: 'minute', text: '1m' },
      '5m': { multiplier: 5, timespan: 'minute', text: '5m' },
      '15m': { multiplier: 15, timespan: 'minute', text: '15m' },
      '30m': { multiplier: 30, timespan: 'minute', text: '30m' },
      '1h': { multiplier: 1, timespan: 'hour', text: '1h' },
      '4h': { multiplier: 4, timespan: 'hour', text: '4h' },
      '1d': { multiplier: 1, timespan: 'day', text: '1d' },
      '1w': { multiplier: 1, timespan: 'week', text: '1w' }
    };
    return map[interval] || { multiplier: 1, timespan: 'minute', text: '1m' };
  };

  // useEffect khởi tạo chart MỘT LẦN
  useEffect(() => {
    if (!ref.current || chartRef.current || initializingRef.current) return;

    console.log(`🚀 Initializing chart for ${symbol} ${interval}`);
    initializingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Clear any existing content
      if (ref.current) {
        ref.current.innerHTML = '';
      }

      // Create new datafeed instance
      datafeedRef.current = new BinanceDatafeed();
      
      // Create new chart instance với period đúng format
      chartRef.current = new KLineChartPro({
        container: ref.current,
        symbol: { 
          ticker: symbol, 
          name: symbol.replace('USDT', ''), 
          exchange: 'Binance', 
          market: 'crypto', 
          priceCurrency: 'USDT', 
          type: 'crypto' 
        },
        period: intervalToPeriod(interval),
        datafeed: datafeedRef.current,
        locale: 'en-US'
      });

      chartRef.current.setTimezone('Asia/Bangkok');
      console.log('✅ Chart initialized successfully');
      setIsLoading(false);
      initializingRef.current = false;
    } catch (err) {
      console.error('❌ Chart initialization error:', err);
      setError('Failed to initialize chart');
      setIsLoading(false);
      initializingRef.current = false;
    }

    return () => {
      console.log('🧹 Cleaning up chart');
      // Cleanup when component unmounts
      if (datafeedRef.current) {
        datafeedRef.current.unsubscribe();
        datafeedRef.current = null;
      }
      if (chartRef.current && ref.current) {
        ref.current.innerHTML = '';
        chartRef.current = null;
      }
      initializingRef.current = false;
      
      // Reset price states
      setCurrentPrice(null);
      setPriceChange(0);
      setLastUpdate(null);
      previousPriceRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  // useEffect để handle thay đổi symbol/interval + cập nhật price display
  useEffect(() => {
    if (!chartRef.current || !datafeedRef.current || initializingRef.current) {
      console.log('⏭️ Skipping subscription update - chart not ready');
      return;
    }

    console.log(`🔄 Updating subscription: ${symbol} ${interval}`);

    // Reset price states khi thay đổi symbol
    setCurrentPrice(null);
    setPriceChange(0);
    previousPriceRef.current = null;

    try {
      // Update subscription với symbol/interval mới
      datafeedRef.current.subscribe(
        {
          ticker: symbol,
          name: symbol.replace('USDT', ''),
          exchange: 'Binance',
          market: 'crypto',
          priceCurrency: 'USDT',
          type: 'crypto'
        },
        intervalToPeriod(interval),
        (data: KLineData) => {
          // Cập nhật price display
          const newPrice = data.close;
          const prevPrice = previousPriceRef.current;
          
          setCurrentPrice(newPrice);
          setLastUpdate(new Date(data.timestamp));
          
          if (prevPrice !== null) {
            const change = newPrice - prevPrice;
            setPriceChange(change);
          }
          
          previousPriceRef.current = newPrice;
          
          console.log(`📊 LIVE PRICE UPDATE: ${symbol} = $${newPrice.toFixed(4)} (${interval})`);
        }
      );
    } catch (err) {
      console.error('❌ Failed to update chart subscription:', err);
      setError('Failed to update chart data');
    }
  }, [symbol, interval]);

  if (error) {
    return (
      <div style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}>
        <div style={{ color: '#ff4d4f', textAlign: 'center' }}>
          <div>Error: {error}</div>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              // Force re-initialization
              if (chartRef.current && ref.current) {
                ref.current.innerHTML = '';
                chartRef.current = null;
                datafeedRef.current = null;
                initializingRef.current = false;
              }
            }}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              border: '1px solid #ff4d4f',
              backgroundColor: 'transparent',
              color: '#ff4d4f',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Realtime Price Display */}
      {currentPrice && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '10px 14px',
          borderRadius: '8px',
          zIndex: 20,
          fontSize: '14px',
          fontFamily: 'var(--font-family-primary)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          minWidth: '180px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <span style={{ 
              fontWeight: 'bold',
              color: '#ffd700'
            }}>
              {symbol}
            </span>
            <span style={{ fontSize: '11px', color: '#ccc' }}>
              {interval}
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '2px'
          }}>
            <span style={{ 
              color: priceChange >= 0 ? '#00d16c' : '#ff4747',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              ${currentPrice.toFixed(4)}
            </span>
            
            {priceChange !== 0 && (
              <span style={{
                color: priceChange >= 0 ? '#00d16c' : '#ff4747',
                fontSize: '12px',
                padding: '2px 6px',
                backgroundColor: priceChange >= 0 ? 'rgba(0, 209, 108, 0.1)' : 'rgba(255, 71, 71, 0.1)',
                borderRadius: '4px'
              }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(4)}
                {priceChange >= 0 ? ' ▲' : ' ▼'}
              </span>
            )}
          </div>
          
          {lastUpdate && (
            <div style={{ 
              fontSize: '10px', 
              color: '#999',
              textAlign: 'right'
            }}>
              {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          zIndex: 10
        }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            gap: '12px',
            color: '#1890ff'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #1890ff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                Loading Chart
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {symbol} ({interval})
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={ref} style={{ width: '100%', height: '100%' }} />
      
      {/* CSS for animations và font styling */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Override chart fonts */
        .klinecharts-pro,
        .klinecharts-pro * {
          font-family: var(--font-family-primary) !important;
        }
        
        /* Specific chart text elements */
        div[class*="klinecharts"] {
          font-family: var(--font-family-primary) !important;
        }
        
        /* Price ticker hover effect */
        div[style*="position: absolute"][style*="top: 10px"] {
          transition: all 0.3s ease;
        }
        
        div[style*="position: absolute"][style*="top: 10px"]:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4) !important;
        }
      `}</style>
    </div>
  );
}