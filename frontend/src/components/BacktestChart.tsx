import { useEffect, useRef, useState } from 'react';
import { init, dispose, registerOverlay } from 'klinecharts';
import './KLineChart.css';

interface KLineData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface BacktestConfig {
  ma20Period: number;
  ma100Period: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  initialCapital: number;
}

interface Trade {
  id: number;
  type: 'buy' | 'sell';
  timestamp: number;
  price: number;
  quantity: number;
  reason: string;
  pnl?: number;
  pnlPercent?: number;
}

interface BacktestResult {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  totalPnL: number;
  totalPnLPercent: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

// Define MA Line Overlay for v9.8.0
const maLineOverlay = {
  name: 'maLine',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, overlay, precision }: any) => {
    if (coordinates.length < 2) return [];
    
    const figures = [];
    const color = overlay.extendData?.color || '#ff6b35';
    const lineWidth = overlay.extendData?.lineWidth || 2;
    
    for (let i = 1; i < coordinates.length; i++) {
      figures.push({
        type: 'line',
        attrs: {
          coordinates: [coordinates[i - 1], coordinates[i]]
        },
        styles: {
          style: 'solid',
          color: color,
          size: lineWidth
        }
      });
    }
    
    return figures;
  }
};

// Buy/Sell Arrow Overlays for v9.8.0
const buyArrowOverlay = {
  name: 'buyArrow',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates }: any) => {
    if (coordinates.length === 0) return [];
    
    const { x, y } = coordinates[0];
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: x, y: y + 15 },
            { x: x - 8, y: y + 25 },
            { x: x - 4, y: y + 25 },
            { x: x - 4, y: y + 35 },
            { x: x + 4, y: y + 35 },
            { x: x + 4, y: y + 25 },
            { x: x + 8, y: y + 25 }
          ]
        },
        styles: {
          style: 'fill',
          color: '#26a69a',
          borderColor: '#1e7b6b',
          borderSize: 2
        }
      },
      {
        type: 'text',
        attrs: {
          x: x,
          y: y + 45,
          text: 'BUY'
        },
        styles: {
          style: 'fill',
          color: '#26a69a',
          size: 10,
          family: 'Arial',
          weight: 'bold'
        }
      }
    ];
  }
};

const sellArrowOverlay = {
  name: 'sellArrow',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates }: any) => {
    if (coordinates.length === 0) return [];
    
    const { x, y } = coordinates[0];
    return [
      {
        type: 'polygon',
        attrs: {
          coordinates: [
            { x: x, y: y - 15 },
            { x: x - 8, y: y - 25 },
            { x: x - 4, y: y - 25 },
            { x: x - 4, y: y - 35 },
            { x: x + 4, y: y - 35 },
            { x: x + 4, y: y - 25 },
            { x: x + 8, y: y - 25 }
          ]
        },
        styles: {
          style: 'fill',
          color: '#ef5350',
          borderColor: '#c62828',
          borderSize: 2
        }
      },
      {
        type: 'text',
        attrs: {
          x: x,
          y: y - 45,
          text: 'SELL'
        },
        styles: {
          style: 'fill',
          color: '#ef5350',
          size: 10,
          family: 'Arial',
          weight: 'bold'
        }
      }
    ];
  }
};

interface BacktestChartProps {
  symbol?: string;
  width?: string;
  height?: string;
}

export default function BacktestChart({
  symbol = 'BTCUSDT',
  width = '100%',
  height = '600px',
}: BacktestChartProps) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<KLineData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Backtest configuration
  const [config, setConfig] = useState<BacktestConfig>({
    ma20Period: 20,
    ma100Period: 100,
    stopLossPercent: 10,
    takeProfitPercent: 20,
    initialCapital: 10000
  });

  // Register overlays once when component mounts
  useEffect(() => {
    registerOverlay(maLineOverlay);
    registerOverlay(buyArrowOverlay);
    registerOverlay(sellArrowOverlay);
    console.log('✅ Registered MA and signal overlays for v9.8.0');
  }, []);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current || chartRef.current || historicalData.length === 0) return;

    try {
      chartRef.current = init('backtest-chart-container', {
        styles: {
          candle: {
            bar: {
              upColor: '#26a69a',
              downColor: '#ef5350',
              noChangeColor: '#888888',
            },
          },
        },
      });

      // Apply data immediately after chart creation
      chartRef.current.applyNewData(historicalData);
      console.log('✅ Initialized backtest chart with data');
    } catch (err) {
      console.error('❌ Chart initialization error:', err);
    }

    return () => {
      if (containerRef.current) {
        dispose('backtest-chart-container');
        containerRef.current.innerHTML = '';
      }
      chartRef.current = null;
    };
  }, [historicalData]); // Depend on historicalData instead of empty array

  // Calculate Moving Average
  const calculateMA = (data: KLineData[], period: number): number[] => {
    const ma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ma.push(NaN);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, candle) => acc + candle.close, 0);
        ma.push(sum / period);
      }
    }
    return ma;
  };

  // Load historical data
  const loadHistoricalData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/history/${symbol}?interval=1d&limit=500`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data: KLineData[] = await response.json();
      setHistoricalData(data);
      
      console.log(`✅ Loaded ${data.length} historical bars for backtest`);
    } catch (error) {
      console.error('❌ Error loading historical data:', error);
      // Use mock data for demo
      const mockData = generateMockData();
      setHistoricalData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock data for demo
  const generateMockData = (): KLineData[] => {
    const data: KLineData[] = [];
    let price = 50000;
    const now = Date.now();
    
    for (let i = 500; i >= 0; i--) {
      const timestamp = now - i * 24 * 60 * 60 * 1000; // Daily data
      const change = (Math.random() - 0.5) * 0.05; // ±2.5% change
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: 1000 + Math.random() * 500
      });
      
      price = close;
    }
    
    return data;
  };

  // Run backtest
  const runBacktest = () => {
    if (historicalData.length === 0) return;
    
    setIsRunning(true);
    setTrades([]);
    
    const ma20 = calculateMA(historicalData, config.ma20Period);
    const ma100 = calculateMA(historicalData, config.ma100Period);
    
    const newTrades: Trade[] = [];
    let position: 'none' | 'long' = 'none';
    let entryPrice = 0;
    let entryIndex = 0;
    let capital = config.initialCapital;
    let quantity = 0;
    let tradeId = 0;
    
    // Clear existing overlays
    if (chartRef.current) {
      chartRef.current.removeOverlay();
    }
    
    // Add MA lines
    const ma20Points = historicalData.map((candle, i) => ({
      timestamp: candle.timestamp,
      value: ma20[i]
    })).filter(p => !isNaN(p.value));
    
    const ma100Points = historicalData.map((candle, i) => ({
      timestamp: candle.timestamp,
      value: ma100[i]
    })).filter(p => !isNaN(p.value));
    
    if (chartRef.current) {
      chartRef.current.createOverlay({
        name: 'maLine',
        id: 'ma20',
        points: ma20Points,
        extendData: { color: '#ff6b35', lineWidth: 2 }
      });
      
      chartRef.current.createOverlay({
        name: 'maLine',
        id: 'ma100',
        points: ma100Points,
        extendData: { color: '#1890ff', lineWidth: 2 }
      });
    }
    
    // Backtest logic
    for (let i = config.ma100Period; i < historicalData.length; i++) {
      const currentCandle = historicalData[i];
      const prevCandle = historicalData[i - 1];
      
      const currentMA20 = ma20[i];
      const currentMA100 = ma100[i];
      const prevMA20 = ma20[i - 1];
      const prevMA100 = ma100[i - 1];
      
      if (isNaN(currentMA20) || isNaN(currentMA100) || isNaN(prevMA20) || isNaN(prevMA100)) {
        continue;
      }
      
      // Buy signal: MA20 crosses above MA100
      if (position === 'none' && prevMA20 <= prevMA100 && currentMA20 > currentMA100) {
        entryPrice = currentCandle.close;
        entryIndex = i;
        quantity = capital / entryPrice;
        position = 'long';
        
        const trade: Trade = {
          id: tradeId++,
          type: 'buy',
          timestamp: currentCandle.timestamp,
          price: entryPrice,
          quantity,
          reason: 'MA20 cross above MA100'
        };
        
        newTrades.push(trade);
        
        // Add buy arrow to chart
        if (chartRef.current) {
          chartRef.current.createOverlay({
            name: 'buyArrow',
            id: `buy_${trade.id}`,
            points: [{
              timestamp: currentCandle.timestamp,
              value: currentCandle.low * 0.98
            }]
          });
        }
      }
      
      // Sell signals
      if (position === 'long') {
        let sellReason = '';
        let shouldSell = false;
        
        // Stop loss
        const stopLossPrice = entryPrice * (1 - config.stopLossPercent / 100);
        if (currentCandle.low <= stopLossPrice) {
          sellReason = `Stop Loss (${config.stopLossPercent}%)`;
          shouldSell = true;
        }
        
        // Take profit
        const takeProfitPrice = entryPrice * (1 + config.takeProfitPercent / 100);
        if (currentCandle.high >= takeProfitPrice) {
          sellReason = `Take Profit (${config.takeProfitPercent}%)`;
          shouldSell = true;
        }
        
        // MA signal exit: MA20 crosses below MA100
        if (prevMA20 >= prevMA100 && currentMA20 < currentMA100) {
          sellReason = 'MA20 cross below MA100';
          shouldSell = true;
        }
        
        if (shouldSell) {
          const sellPrice = sellReason.includes('Stop Loss') ? stopLossPrice :
                           sellReason.includes('Take Profit') ? takeProfitPrice :
                           currentCandle.close;
          
          const pnl = (sellPrice - entryPrice) * quantity;
          const pnlPercent = ((sellPrice - entryPrice) / entryPrice) * 100;
          
          capital += pnl;
          
          const trade: Trade = {
            id: tradeId++,
            type: 'sell',
            timestamp: currentCandle.timestamp,
            price: sellPrice,
            quantity,
            reason: sellReason,
            pnl,
            pnlPercent
          };
          
          newTrades.push(trade);
          position = 'none';
          
          // Add sell arrow to chart
          if (chartRef.current) {
            chartRef.current.createOverlay({
              name: 'sellArrow',
              id: `sell_${trade.id}`,
              points: [{
                timestamp: currentCandle.timestamp,
                value: currentCandle.high * 1.02
              }]
            });
          }
        }
      }
    }
    
    // Calculate backtest results
    const totalPnL = capital - config.initialCapital;
    const totalPnLPercent = (totalPnL / config.initialCapital) * 100;
    const sellTrades = newTrades.filter(t => t.type === 'sell');
    const winTrades = sellTrades.filter(t => (t.pnl || 0) > 0).length;
    const lossTrades = sellTrades.filter(t => (t.pnl || 0) < 0).length;
    const winRate = sellTrades.length > 0 ? (winTrades / sellTrades.length) * 100 : 0;
    
    const result: BacktestResult = {
      totalTrades: sellTrades.length,
      winTrades,
      lossTrades,
      totalPnL,
      totalPnLPercent,
      winRate,
      maxDrawdown: 0, // Calculate later if needed
      sharpeRatio: 0  // Calculate later if needed
    };
    
    setTrades(newTrades);
    setBacktestResult(result);
    setIsRunning(false);
    
    console.log(`✅ Backtest completed: ${sellTrades.length} trades, PnL: ${totalPnL.toFixed(2)}`);
  };

  // Load data on component mount
  useEffect(() => {
    loadHistoricalData();
  }, [symbol]);

  return (
    <div style={{ 
      display: 'flex', 
      gap: '20px', 
      padding: '0', 
      fontFamily: 'Arial, sans-serif',
      height: '100%',
      minHeight: height
    }}>
      {/* Chart Section */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>
            Backtest Chart - {symbol}
          </h2>
          
          {/* Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                MA20:
              </label>
              <input
                type="number"
                value={config.ma20Period}
                onChange={(e) => setConfig({...config, ma20Period: parseInt(e.target.value)})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '50px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                MA100:
              </label>
              <input
                type="number"
                value={config.ma100Period}
                onChange={(e) => setConfig({...config, ma100Period: parseInt(e.target.value)})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '50px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Stop Loss %:
              </label>
              <input
                type="number"
                value={config.stopLossPercent}
                onChange={(e) => setConfig({...config, stopLossPercent: parseFloat(e.target.value)})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '50px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Take Profit %:
              </label>
              <input
                type="number"
                value={config.takeProfitPercent}
                onChange={(e) => setConfig({...config, takeProfitPercent: parseFloat(e.target.value)})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '50px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Capital:
              </label>
              <input
                type="number"
                value={config.initialCapital}
                onChange={(e) => setConfig({...config, initialCapital: parseFloat(e.target.value)})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '70px',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <button
              onClick={runBacktest}
              disabled={isRunning || isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: isRunning ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              {isRunning ? 'Running...' : 'Run Backtest'}
            </button>
          </div>
          
          {/* Chart Container */}
          <div 
            ref={containerRef}
            id="backtest-chart-container"
            style={{ 
              width: '100%', 
              flex: 1,
              minHeight: '400px',
              border: '1px solid #eee',
              borderRadius: '4px',
              position: 'relative'
            }} 
          >
            {/* Loading overlay */}
            {(isLoading || historicalData.length === 0) && (
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
                zIndex: 10,
                borderRadius: '4px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  gap: '12px',
                  color: '#666'
                }}>
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <div>Loading historical data...</div>
                    </>
                  ) : (
                    <div>No data available. Click "Run Backtest" to start.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '10px',
            fontSize: '12px',
            color: '#666',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', backgroundColor: '#ff6b35' }}></div>
              <span>MA20</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', backgroundColor: '#1890ff' }}></div>
              <span>MA100</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '8px solid #26a69a' }}></div>
              <span>Buy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '0', height: '0', borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #ef5350' }}></div>
              <span>Sell</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Results Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Summary */}
        {backtestResult && (
          <div style={{ 
            background: 'white', 
            borderRadius: '8px', 
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>Results</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
              <div>
                <span style={{ color: '#666' }}>Trades:</span>
                <div style={{ fontWeight: 'bold', color: '#333' }}>{backtestResult.totalTrades}</div>
              </div>
              
              <div>
                <span style={{ color: '#666' }}>Win Rate:</span>
                <div style={{ fontWeight: 'bold', color: backtestResult.winRate >= 50 ? '#26a69a' : '#ef5350' }}>
                  {backtestResult.winRate.toFixed(1)}%
                </div>
              </div>
              
              <div>
                <span style={{ color: '#666' }}>Wins:</span>
                <div style={{ fontWeight: 'bold', color: '#26a69a' }}>{backtestResult.winTrades}</div>
              </div>
              
              <div>
                <span style={{ color: '#666' }}>Losses:</span>
                <div style={{ fontWeight: 'bold', color: '#ef5350' }}>{backtestResult.lossTrades}</div>
              </div>
              
              <div style={{ gridColumn: 'span 2', marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <span style={{ color: '#666', fontSize: '12px' }}>Total P&L:</span>
                <div style={{ 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  color: backtestResult.totalPnL >= 0 ? '#26a69a' : '#ef5350' 
                }}>
                  ${backtestResult.totalPnL.toFixed(2)} ({backtestResult.totalPnLPercent.toFixed(2)}%)
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Trade History */}
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px' }}>Trade History</h3>
          
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            border: '1px solid #eee',
            borderRadius: '4px'
          }}>
            {trades.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No trades yet. Run backtest to see results.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Date</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>Price</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>P&L</th>
                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={trade.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{ 
                          color: trade.type === 'buy' ? '#26a69a' : '#ef5350',
                          fontWeight: 'bold'
                        }}>
                          {trade.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '8px', color: '#666' }}>
                        {new Date(trade.timestamp).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>
                        ${trade.price.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        textAlign: 'right', 
                        fontFamily: 'monospace',
                        color: trade.pnl !== undefined ? (trade.pnl >= 0 ? '#26a69a' : '#ef5350') : '#666'
                      }}>
                        {trade.pnl !== undefined ? 
                          `$${trade.pnl.toFixed(2)} (${trade.pnlPercent?.toFixed(1)}%)` : 
                          '-'
                        }
                      </td>
                      <td style={{ padding: '8px', color: '#666', fontSize: '11px' }}>
                        {trade.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
