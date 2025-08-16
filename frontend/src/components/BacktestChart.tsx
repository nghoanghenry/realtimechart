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

interface SymbolOption {
  symbol: string;
  name: string;
  category: string;
}

interface TimeFrame {
  interval: string;
  label: string;
  icon: string;
}

interface BacktestConfig {
  // Source
  symbol: string;
  interval: string;
  
  // Time Range  
  fromDate: string;
  toDate: string;
  
  // Strategy
  lots: number;
  stopLoss: number;  // %
  takeProfit: number; // %
  
  // Legacy fields for compatibility
  ma20Period: number;
  ma100Period: number;
  stopLossPercent: number;
  takeProfitPercent: number;
  initialCapital: number;
}

// Time frames với icons
const TIME_FRAMES: TimeFrame[] = [
  { interval: '5m', label: '5 Minutes', icon: '⚡' },
  { interval: '4h', label: '4 Hours', icon: '📈' },
  { interval: '1d', label: 'Daily', icon: '📅' },
  { interval: '1w', label: 'Weekly', icon: '🗓️' }
];

// Popular crypto symbols với tên và category
const POPULAR_SYMBOLS: SymbolOption[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'Major' },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'Major' },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'Major' },
  { symbol: 'ADAUSDT', name: 'Cardano', category: 'Major' },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'Major' },
  { symbol: 'XRPUSDT', name: 'Ripple', category: 'Major' },
  { symbol: 'DOTUSDT', name: 'Polkadot', category: 'Major' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', category: 'Meme' },
  { symbol: 'SHIBUSDT', name: 'Shiba Inu', category: 'Meme' },
  { symbol: 'AVAXUSDT', name: 'Avalanche', category: 'Layer 1' },
  { symbol: 'MATICUSDT', name: 'Polygon', category: 'Layer 2' },
  { symbol: 'LINKUSDT', name: 'Chainlink', category: 'Oracle' },
  { symbol: 'UNIUSDT', name: 'Uniswap', category: 'DeFi' },
  { symbol: 'LTCUSDT', name: 'Litecoin', category: 'Payment' },
  { symbol: 'BCHUSDT', name: 'Bitcoin Cash', category: 'Payment' },
  { symbol: 'ATOMUSDT', name: 'Cosmos', category: 'Layer 1' },
  { symbol: 'FILUSDT', name: 'Filecoin', category: 'Storage' },
  { symbol: 'TRXUSDT', name: 'TRON', category: 'Layer 1' },
  { symbol: 'ETCUSDT', name: 'Ethereum Classic', category: 'Layer 1' },
  { symbol: 'XLMUSDT', name: 'Stellar', category: 'Payment' }
];

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

interface StrategyCondition {
  id: string;
  indicator1: string;
  comparison: string;
  indicator2: string;
  param1: number;
  param2: number;
  logicOperator?: 'AND' | 'OR'; // For multiple conditions
}

interface StrategyTemplate {
  name: string;
  description: string;
  icon: string;
  conditions: Omit<StrategyCondition, 'id'>[];
  defaultParams: {
    stopLoss: number;
    takeProfit: number;
    lots: number;
  };
}

// Predefined Strategy Templates
const STRATEGY_TEMPLATES: StrategyTemplate[] = [
  {
    name: 'MovingAvg Cross',
    description: 'MA fast crosses above MA slow',
    icon: '📈',
    conditions: [
      {
        indicator1: 'SMA',
        comparison: 'Cross Above',
        indicator2: 'SMA',
        param1: 20,
        param2: 50
      }
    ],
    defaultParams: { stopLoss: 2, takeProfit: 4, lots: 10000 }
  },
  {
    name: 'MovingAvg2Line Cross',
    description: 'Double MA crossover strategy',
    icon: '📊',
    conditions: [
      {
        indicator1: 'SMA',
        comparison: 'Cross Above',
        indicator2: 'EMA',
        param1: 21,
        param2: 50
      }
    ],
    defaultParams: { stopLoss: 1.5, takeProfit: 3, lots: 10000 }
  },
  {
    name: 'Bollinger Bands Strategy',
    description: 'Price touches lower band then reverses',
    icon: '🎯',
    conditions: [
      {
        indicator1: 'Price',
        comparison: 'Cross Above',
        indicator2: 'BB_Lower',
        param1: 20,
        param2: 2
      }
    ],
    defaultParams: { stopLoss: 2, takeProfit: 4, lots: 10000 }
  },
  {
    name: 'MACD Strategy',
    description: 'MACD line crosses above signal line',
    icon: '⚡',
    conditions: [
      {
        indicator1: 'MACD',
        comparison: 'Cross Above',
        indicator2: 'MACD_Signal',
        param1: 12,
        param2: 26
      }
    ],
    defaultParams: { stopLoss: 2.5, takeProfit: 5, lots: 10000 }
  },
  {
    name: 'RSI Oversold Strategy',
    description: 'RSI below 30 then crosses above',
    icon: '🔄',
    conditions: [
      {
        indicator1: 'RSI',
        comparison: 'Cross Above',
        indicator2: 'Value',
        param1: 14,
        param2: 30
      }
    ],
    defaultParams: { stopLoss: 3, takeProfit: 6, lots: 10000 }
  },
  {
    name: 'Momentum Strategy',
    description: 'Price momentum above threshold',
    icon: '🚀',
    conditions: [
      {
        indicator1: 'Momentum',
        comparison: 'Above',
        indicator2: 'Value',
        param1: 10,
        param2: 0
      }
    ],
    defaultParams: { stopLoss: 2, takeProfit: 4, lots: 10000 }
  },
  {
    name: 'ChannelBreakOut Strategy',
    description: 'Price breaks above resistance channel',
    icon: '📈',
    conditions: [
      {
        indicator1: 'Price',
        comparison: 'Above',
        indicator2: 'Channel_High',
        param1: 20,
        param2: 0
      }
    ],
    defaultParams: { stopLoss: 2, takeProfit: 5, lots: 10000 }
  },
  {
    name: 'Keltner Channels Strategy',
    description: 'Price breaks out of Keltner channels',
    icon: '📊',
    conditions: [
      {
        indicator1: 'Price',
        comparison: 'Above',
        indicator2: 'Keltner_Upper',
        param1: 20,
        param2: 1.5
      }
    ],
    defaultParams: { stopLoss: 2, takeProfit: 4, lots: 10000 }
  },
  {
    name: 'Consecutive Up/Down Strategy',
    description: 'Multiple consecutive bullish candles',
    icon: '📈',
    conditions: [
      {
        indicator1: 'Consecutive_Up',
        comparison: 'Above',
        indicator2: 'Value',
        param1: 3,
        param2: 0
      }
    ],
    defaultParams: { stopLoss: 1.5, takeProfit: 3, lots: 10000 }
  },
  {
    name: 'InSide Bar Strategy',
    description: 'Inside bar pattern breakout',
    icon: '📊',
    conditions: [
      {
        indicator1: 'Inside_Bar',
        comparison: 'Above',
        indicator2: 'Value',
        param1: 1,
        param2: 0
      }
    ],
    defaultParams: { stopLoss: 2, takeProfit: 4, lots: 10000 }
  },
  {
    name: 'Greedy Strategy',
    description: 'High risk high reward strategy',
    icon: '💰',
    conditions: [
      {
        indicator1: 'SMA',
        comparison: 'Cross Above',
        indicator2: 'SMA',
        param1: 5,
        param2: 10
      }
    ],
    defaultParams: { stopLoss: 5, takeProfit: 10, lots: 20000 }
  }
];

// Available indicators
const INDICATORS = [
  'SMA', 'EMA', 'Price', 'RSI', 'MACD', 'MACD_Signal', 
  'BB_Upper', 'BB_Lower', 'BB_Middle', 'Keltner_Upper', 'Keltner_Lower',
  'Channel_High', 'Channel_Low', 'Momentum', 'Consecutive_Up', 'Consecutive_Down',
  'Inside_Bar', 'Outside_Bar', 'Value'
];

const COMPARISONS = [
  'Above', 'Below', 'Cross Above', 'Cross Below', 
  'Equal', 'Greater Than', 'Less Than'
];

// Define MA Line Overlay for v9.8.0
const maLineOverlay = {
  name: 'maLine',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, overlay }: any) => {
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

export default function BacktestChart() {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<KLineData[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [conditions, setConditions] = useState<StrategyCondition[]>([
    {
      id: '1',
      indicator1: 'SMA',
      comparison: 'Cross Above',
      indicator2: 'SMA',
      param1: 20,
      param2: 50
    }
  ]);
  
  // Backtest configuration
  const [config, setConfig] = useState<BacktestConfig>({
    // Source
    symbol: 'BTCUSDT',
    interval: '1d',
    
    // Time Range
    fromDate: '2023-01-29T12:00',
    toDate: '2023-03-12T04:00',
    
    // Strategy
    lots: 1000000,
    stopLoss: 1,
    takeProfit: 2,
    
    // Legacy fields for compatibility
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
      
      // Create indicators based on strategy conditions
      if (usesMACD()) {
        chartRef.current.createIndicator('MACD', false, { id: 'MACD_PANE' });
        console.log('✅ Created MACD indicator');
      }
      
      if (usesRSI()) {
        chartRef.current.createIndicator('RSI', false, { id: 'RSI_PANE' });
        console.log('✅ Created RSI indicator');
      }
      
      // Setup synchronization after chart is ready
      setTimeout(() => {
        syncChartsZoom();
      }, 100);
      
    } catch (err) {
      console.error('❌ Chart initialization error:', err);
    }

    return () => {
      // Clear sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      
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

  // Calculate EMA
  const calculateEMA = (data: KLineData[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        ema.push(data[i].close);
      } else if (i < period - 1) {
        ema.push(NaN);
      } else if (i === period - 1) {
        // Use SMA for the first EMA value
        const sma = data.slice(0, period).reduce((sum, candle) => sum + candle.close, 0) / period;
        ema.push(sma);
      } else {
        const prevEMA = ema[i - 1];
        ema.push((data[i].close - prevEMA) * multiplier + prevEMA);
      }
    }
    
    return ema;
  };

  // Helper function to calculate EMA from values array
  const calculateEMAFromValues = (values: number[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < values.length; i++) {
      if (isNaN(values[i])) {
        ema.push(NaN);
        continue;
      }
      
      if (i === 0 || ema.filter(v => !isNaN(v)).length === 0) {
        ema.push(values[i]);
      } else {
        const prevEMA = ema.slice(0, i).filter(v => !isNaN(v)).pop() || values[i];
        ema.push((values[i] - prevEMA) * multiplier + prevEMA);
      }
    }
    
    return ema;
  };

  // Calculate RSI
  const calculateRSI = (data: KLineData[], period: number = 14): number[] => {
    const rsi: number[] = [];
    let gains: number[] = [];
    let losses: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        rsi.push(NaN);
        gains.push(0);
        losses.push(0);
        continue;
      }
      
      const change = data[i].close - data[i - 1].close;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      gains.push(gain);
      losses.push(loss);
      
      if (i < period) {
        rsi.push(NaN);
        continue;
      }
      
      // Calculate average gain and loss
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  };

  // Calculate MACD
  const calculateMACD = (data: KLineData[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
    const ema12 = calculateEMA(data, fastPeriod);
    const ema26 = calculateEMA(data, slowPeriod);
    
    const macdLine: number[] = [];
    const signalLine: number[] = [];
    const histogram: number[] = [];
    
    // Calculate MACD line
    for (let i = 0; i < data.length; i++) {
      if (isNaN(ema12[i]) || isNaN(ema26[i])) {
        macdLine.push(NaN);
      } else {
        macdLine.push(ema12[i] - ema26[i]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    signalLine.push(...calculateEMAFromValues(macdLine, signalPeriod));
    
    // Calculate histogram
    for (let i = 0; i < data.length; i++) {
      if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
        histogram.push(NaN);
      } else {
        histogram.push(macdLine[i] - signalLine[i]);
      }
    }
    
    return { macdLine, signalLine, histogram };
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (data: KLineData[], period: number = 20, stdDev: number = 2) => {
    const sma = calculateMA(data, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
        continue;
      }
      
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, candle) => sum + Math.pow(candle.close - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (standardDeviation * stdDev));
      lower.push(mean - (standardDeviation * stdDev));
    }
    
    return { upper, middle: sma, lower };
  };

  // Calculate Momentum
  const calculateMomentum = (data: KLineData[], period: number = 10): number[] => {
    const momentum: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        momentum.push(NaN);
      } else {
        momentum.push(data[i].close - data[i - period].close);
      }
    }
    
    return momentum;
  };

  // Load historical data
  const loadHistoricalData = async () => {
    setIsLoading(true);
    try {
      // Convert datetime-local to timestamp
      const startTime = new Date(config.fromDate).getTime();
      const endTime = new Date(config.toDate).getTime();
      
      const response = await fetch(
        `http://localhost/api/history/${config.symbol}?interval=${config.interval}&startTime=${startTime}&endTime=${endTime}&limit=500`
      );
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

  // Strategy Template Functions
  const applyTemplate = (template: StrategyTemplate) => {
    setSelectedTemplate(template);
    
    // Apply template conditions
    const newConditions: StrategyCondition[] = template.conditions.map((condition, index) => ({
      ...condition,
      id: Date.now().toString() + index
    }));
    setConditions(newConditions);
    
    // Apply template default parameters
    setConfig(prev => ({
      ...prev,
      lots: template.defaultParams.lots,
      stopLoss: template.defaultParams.stopLoss,
      takeProfit: template.defaultParams.takeProfit
    }));
  };

  // Add new condition
  const addCondition = () => {
    const newCondition: StrategyCondition = {
      id: Date.now().toString(),
      indicator1: 'SMA',
      comparison: 'Above',
      indicator2: 'SMA',
      param1: 20,
      param2: 50
    };
    
    setConditions(prev => [...prev, newCondition]);
  };

  // Remove condition
  const removeCondition = (id: string) => {
    setConditions(prev => prev.filter(c => c.id !== id));
  };

  // Update condition
  const updateCondition = (id: string, updates: Partial<StrategyCondition>) => {
    setConditions(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  // Reset to custom strategy
  const resetToCustom = () => {
    setSelectedTemplate(null);
    setConditions([{
      id: '1',
      indicator1: 'SMA',
      comparison: 'Cross Above',
      indicator2: 'SMA',
      param1: 20,
      param2: 50
    }]);
  };

  // Check if strategy uses specific indicators
  const usesMACD = () => {
    return conditions.some(c => 
      c.indicator1.includes('MACD') || c.indicator2.includes('MACD')
    );
  };

  const usesRSI = () => {
    return conditions.some(c => 
      c.indicator1 === 'RSI' || c.indicator2 === 'RSI'
    );
  };

  // Initialize subcharts - Simplified approach using built-in indicators
  const initializeSubcharts = () => {
    if (!chartRef.current) return;
    
    try {
      // Remove existing indicators first
      chartRef.current.removeIndicator('MACD_PANE');
      chartRef.current.removeIndicator('RSI_PANE');
      
      // Add indicators based on strategy conditions
      if (usesMACD()) {
        chartRef.current.createIndicator('MACD', false, { id: 'MACD_PANE' });
        console.log('✅ Added MACD indicator pane');
      }
      
      if (usesRSI()) {
        chartRef.current.createIndicator('RSI', false, { id: 'RSI_PANE' });
        console.log('✅ Added RSI indicator pane');
      }
    } catch (err) {
      console.error('❌ Error initializing subcharts:', err);
    }
  };

  // Synchronize zoom and pan between charts - Simplified for single chart
  const syncChartsZoom = () => {
    // Since we're using built-in indicators, they automatically sync with main chart
    console.log('✅ Using built-in indicator synchronization');
  };

  // Update subcharts with data - Simplified for built-in indicators
  const updateSubcharts = (_macdData: any, _rsiData: number[]) => {
    // Built-in indicators automatically update with the main chart data
    // No manual data application needed - indicators calculate internally
    console.log('✅ Built-in indicators auto-updating with chart data');
    
    if (usesMACD()) {
      console.log('📊 MACD indicator active');
    }
    
    if (usesRSI()) {
      console.log('📊 RSI indicator active');
    }
  };

  // Evaluate strategy conditions
  const evaluateConditions = (
    candle: KLineData, 
    prevCandle: KLineData | null,
    indicators: { [key: string]: number[] },
    index: number
  ): { shouldBuy: boolean; shouldSell: boolean; reason: string } => {
    let shouldBuy = false;
    let shouldSell = false;
    let reason = '';

    for (const condition of conditions) {
      const { indicator1, comparison, indicator2, param1, param2 } = condition;
      
      let value1 = 0;
      let value2 = 0;
      let prevValue1 = 0;
      let prevValue2 = 0;

      // Get indicator1 values
      switch (indicator1) {
        case 'Price':
          value1 = candle.close;
          prevValue1 = prevCandle?.close || candle.close;
          break;
        case 'SMA':
          value1 = indicators.sma?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.sma?.[index - 1] || 0) : value1;
          break;
        case 'EMA':
          value1 = indicators.ema?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.ema?.[index - 1] || 0) : value1;
          break;
        case 'RSI':
          value1 = indicators.rsi?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.rsi?.[index - 1] || 0) : value1;
          break;
        case 'MACD':
          value1 = indicators.macd?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.macd?.[index - 1] || 0) : value1;
          break;
        case 'MACD_Signal':
          value1 = indicators.macd_signal?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.macd_signal?.[index - 1] || 0) : value1;
          break;
        case 'BB_Upper':
          value1 = indicators.bb_upper?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.bb_upper?.[index - 1] || 0) : value1;
          break;
        case 'BB_Lower':
          value1 = indicators.bb_lower?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.bb_lower?.[index - 1] || 0) : value1;
          break;
        case 'BB_Middle':
          value1 = indicators.bb_middle?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.bb_middle?.[index - 1] || 0) : value1;
          break;
        case 'Momentum':
          value1 = indicators.momentum?.[index] || 0;
          prevValue1 = index > 0 ? (indicators.momentum?.[index - 1] || 0) : value1;
          break;
        default:
          value1 = 0;
          prevValue1 = 0;
      }

      // Get indicator2 values
      switch (indicator2) {
        case 'Price':
          value2 = candle.close;
          prevValue2 = prevCandle?.close || candle.close;
          break;
        case 'SMA':
          value2 = indicators.sma2?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.sma2?.[index - 1] || 0) : value2;
          break;
        case 'EMA':
          value2 = indicators.ema?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.ema?.[index - 1] || 0) : value2;
          break;
        case 'RSI':
          value2 = indicators.rsi?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.rsi?.[index - 1] || 0) : value2;
          break;
        case 'MACD_Signal':
          value2 = indicators.macd_signal?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.macd_signal?.[index - 1] || 0) : value2;
          break;
        case 'BB_Upper':
          value2 = indicators.bb_upper?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.bb_upper?.[index - 1] || 0) : value2;
          break;
        case 'BB_Lower':
          value2 = indicators.bb_lower?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.bb_lower?.[index - 1] || 0) : value2;
          break;
        case 'BB_Middle':
          value2 = indicators.bb_middle?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.bb_middle?.[index - 1] || 0) : value2;
          break;
        case 'Momentum':
          value2 = indicators.momentum?.[index] || 0;
          prevValue2 = index > 0 ? (indicators.momentum?.[index - 1] || 0) : value2;
          break;
        case 'Value':
          value2 = param2;
          prevValue2 = param2;
          break;
        default:
          value2 = param2;
          prevValue2 = param2;
      }

      // Skip if values are invalid
      if (isNaN(value1) || isNaN(value2) || isNaN(prevValue1) || isNaN(prevValue2)) {
        continue;
      }

      // Evaluate condition
      let conditionMet = false;
      
      switch (comparison) {
        case 'Above':
          conditionMet = value1 > value2;
          break;
        case 'Below':
          conditionMet = value1 < value2;
          break;
        case 'Cross Above':
          conditionMet = prevValue1 <= prevValue2 && value1 > value2;
          break;
        case 'Cross Below':
          conditionMet = prevValue1 >= prevValue2 && value1 < value2;
          break;
        case 'Equal':
          conditionMet = Math.abs(value1 - value2) < 0.0001;
          break;
        case 'Greater Than':
          conditionMet = value1 > value2;
          break;
        case 'Less Than':
          conditionMet = value1 < value2;
          break;
        default:
          conditionMet = false;
      }

      if (conditionMet) {
        if (comparison.includes('Above') || comparison.includes('Cross Above') || comparison.includes('Greater')) {
          shouldBuy = true;
          reason = `${indicator1}(${param1}) ${comparison} ${indicator2}(${param2})`;
        } else {
          shouldSell = true;
          reason = `${indicator1}(${param1}) ${comparison} ${indicator2}(${param2})`;
        }
        break; // Use first matching condition
      }
    }

    return { shouldBuy, shouldSell, reason };
  };

  // Run backtest
  const runBacktest = async () => {
    try {
      await loadHistoricalData();
      // Chờ một chút để chart được khởi tạo
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error loading data for backtest:', error);
      return;
    }
    if (historicalData.length === 0) return;
    
    setIsRunning(true);
    setTrades([]);
    
    // Initialize subcharts first
    initializeSubcharts();
    
    const ma20 = calculateMA(historicalData, config.ma20Period);
    const ma100 = calculateMA(historicalData, config.ma100Period);
    
    // Calculate all indicators for strategy conditions
    const ema21 = calculateEMA(historicalData, 21);
    const rsi = calculateRSI(historicalData, 14);
    const macd = calculateMACD(historicalData, 12, 26, 9);
    const bb = calculateBollingerBands(historicalData, 20, 2);
    const momentum = calculateMomentum(historicalData, 10);

    // Update subcharts with indicator data
    updateSubcharts(macd, rsi);

    const indicators: { [key: string]: number[] } = {
      sma: ma20,    // Using ma20 as default SMA
      sma2: ma100,  // Using ma100 as second SMA
      ema: ema21,
      rsi: rsi,
      macd: macd.macdLine,
      macd_signal: macd.signalLine,
      bb_upper: bb.upper,
      bb_middle: bb.middle,
      bb_lower: bb.lower,
      momentum: momentum,
      price: historicalData.map(d => d.close)
    };
    
    const newTrades: Trade[] = [];
    let position: 'none' | 'long' = 'none';
    let entryPrice = 0;
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
      
      // Get previous candle for condition evaluation
      const prevCandle = i > 0 ? historicalData[i - 1] : null;
      
      const currentMA20 = ma20[i];
      const currentMA100 = ma100[i];
      const prevMA20 = ma20[i - 1];
      const prevMA100 = ma100[i - 1];
      
      if (isNaN(currentMA20) || isNaN(currentMA100) || isNaN(prevMA20) || isNaN(prevMA100)) {
        continue;
      }

      // Evaluate strategy conditions
      const { shouldBuy, shouldSell, reason } = evaluateConditions(
        currentCandle, 
        prevCandle, 
        indicators, 
        i
      );
      
      // Buy signal from strategy conditions
      if (position === 'none' && shouldBuy) {
        entryPrice = currentCandle.close;
        quantity = capital / entryPrice;
        position = 'long';
        
        const trade: Trade = {
          id: tradeId++,
          type: 'buy',
          timestamp: currentCandle.timestamp,
          price: entryPrice,
          quantity,
          reason: reason || 'Strategy condition met'
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
        let shouldSellPosition = false;
        
        // Strategy sell signal
        if (shouldSell) {
          sellReason = reason || 'Strategy sell condition met';
          shouldSellPosition = true;
        }
        
        // Stop loss
        const stopLossPrice = entryPrice * (1 - config.stopLoss / 100);
        if (currentCandle.low <= stopLossPrice) {
          sellReason = `Stop Loss (${config.stopLoss}%)`;
          shouldSellPosition = true;
        }
        
        // Take profit
        const takeProfitPrice = entryPrice * (1 + config.takeProfit / 100);
        if (currentCandle.high >= takeProfitPrice) {
          sellReason = `Take Profit (${config.takeProfit}%)`;
          shouldSellPosition = true;
        }
        
        // MA signal exit: MA20 crosses below MA100
        if (prevMA20 >= prevMA100 && currentMA20 < currentMA100) {
          sellReason = 'MA20 cross below MA100';
          shouldSellPosition = true;
        }
        
        if (shouldSellPosition) {
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

  // Load data on component mount and when symbol/interval changes
  useEffect(() => {
    loadHistoricalData();
  }, [config.symbol, config.interval]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '20px', 
      padding: '0', 
      fontFamily: 'var(--font-family-primary)',
      minHeight: '100vh'
    }}>
      {/* Chart Section */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column'
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>
            Backtest Chart - {config.symbol} ({TIME_FRAMES.find(f => f.interval === config.interval)?.icon} {TIME_FRAMES.find(f => f.interval === config.interval)?.label})
          </h2>
          
          {/* Controls */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            marginBottom: '15px',
            flexWrap: 'wrap',
            alignItems: 'flex-end'
          }}>
            {/* Symbol Selection */}
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Symbol:
              </label>
              <select
                value={config.symbol}
                onChange={(e) => setConfig({...config, symbol: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '120px',
                  fontSize: '12px'
                }}
              >
                {POPULAR_SYMBOLS.map(option => (
                  <option key={option.symbol} value={option.symbol}>
                    {option.symbol} - {option.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Frame Selection */}
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Interval:
              </label>
              <select
                value={config.interval}
                onChange={(e) => setConfig({...config, interval: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '100px',
                  fontSize: '12px'
                }}
              >
                {TIME_FRAMES.map(frame => (
                  <option key={frame.interval} value={frame.interval}>
                    {frame.icon} {frame.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range */}
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                FROM:
              </label>
              <input
                type="datetime-local"
                value={config.fromDate}
                onChange={(e) => setConfig({...config, fromDate: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                TO:
              </label>
              <input
                type="datetime-local"
                value={config.toDate}
                onChange={(e) => setConfig({...config, toDate: e.target.value})}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
            </div>

            {/* Strategy Parameters */}
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                LOTS:
              </label>
              <input
                type="text"
                value={`$${config.lots.toLocaleString()}`}
                onChange={(e) => {
                  const value = e.target.value.replace(/[$,]/g, '');
                  if (!isNaN(Number(value))) {
                    setConfig({...config, lots: Number(value)});
                  }
                }}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  width: '80px',
                  fontSize: '12px'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                SL (%):
              </label>
              <input
                type="number"
                value={config.stopLoss}
                onChange={(e) => setConfig({...config, stopLoss: parseFloat(e.target.value)})}
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
                TP (%):
              </label>
              <input
                type="number"
                value={config.takeProfit}
                onChange={(e) => setConfig({...config, takeProfit: parseFloat(e.target.value)})}
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
            
            {/* Strategy Templates Section */}
            <div style={{ width: '100%', marginTop: '10px' }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>
                Strategy Templates:
              </label>
              
              {/* Template Buttons */}
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px',
                marginBottom: '10px'
              }}>
                {STRATEGY_TEMPLATES.slice(0, 6).map((template) => (
                  <button
                    key={template.name}
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: selectedTemplate?.name === template.name ? '#007bff' : '#f8f9fa',
                      color: selectedTemplate?.name === template.name ? 'white' : '#666',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title={template.description}
                  >
                    <span>{template.icon}</span>
                    <span>{template.name}</span>
                  </button>
                ))}
                
                <button
                  onClick={resetToCustom}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: !selectedTemplate ? '#28a745' : '#f8f9fa',
                    color: !selectedTemplate ? 'white' : '#666',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  Custom
                </button>
              </div>

              {/* Show more templates button */}
              <details style={{ marginBottom: '10px' }}>
                <summary style={{ 
                  fontSize: '11px', 
                  color: '#007bff', 
                  cursor: 'pointer',
                  marginBottom: '5px'
                }}>
                  More Templates ({STRATEGY_TEMPLATES.length - 6} more)
                </summary>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '4px'
                }}>
                  {STRATEGY_TEMPLATES.slice(6).map((template) => (
                    <button
                      key={template.name}
                      onClick={() => applyTemplate(template)}
                      style={{
                        padding: '3px 6px',
                        backgroundColor: selectedTemplate?.name === template.name ? '#007bff' : '#f8f9fa',
                        color: selectedTemplate?.name === template.name ? 'white' : '#666',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title={template.description}
                    >
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                    </button>
                  ))}
                </div>
              </details>

              {/* Current Strategy Conditions */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <label style={{ fontSize: '11px', color: '#666' }}>
                    Strategy Conditions:
                  </label>
                  {selectedTemplate && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#007bff',
                      backgroundColor: '#e3f2fd',
                      padding: '2px 6px',
                      borderRadius: '8px'
                    }}>
                      {selectedTemplate.icon} {selectedTemplate.name}
                    </span>
                  )}
                </div>

                {conditions.map((condition) => (
                  <div key={condition.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    marginBottom: '6px',
                    fontSize: '10px'
                  }}>
                    <select
                      value={condition.indicator1}
                      onChange={(e) => updateCondition(condition.id, { indicator1: e.target.value })}
                      style={{
                        padding: '2px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '10px',
                        width: '60px'
                      }}
                    >
                      {INDICATORS.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>

                    <select
                      value={condition.comparison}
                      onChange={(e) => updateCondition(condition.id, { comparison: e.target.value })}
                      style={{
                        padding: '2px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '10px',
                        width: '70px'
                      }}
                    >
                      {COMPARISONS.map(comp => (
                        <option key={comp} value={comp}>{comp}</option>
                      ))}
                    </select>

                    <select
                      value={condition.indicator2}
                      onChange={(e) => updateCondition(condition.id, { indicator2: e.target.value })}
                      style={{
                        padding: '2px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '10px',
                        width: '60px'
                      }}
                    >
                      {INDICATORS.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      value={condition.param1}
                      onChange={(e) => updateCondition(condition.id, { param1: Number(e.target.value) })}
                      style={{
                        padding: '2px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '10px',
                        width: '35px'
                      }}
                    />

                    <input
                      type="number"
                      value={condition.param2}
                      onChange={(e) => updateCondition(condition.id, { param2: Number(e.target.value) })}
                      style={{
                        padding: '2px 4px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        fontSize: '10px',
                        width: '35px'
                      }}
                    />

                    {conditions.length > 1 && (
                      <button
                        onClick={() => removeCondition(condition.id)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontSize: '12px',
                          padding: '0 4px'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    onClick={addCondition}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    + Add Condition
                  </button>
                </div>
              </div>
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
              {isRunning ? 'Running...' : 'APPLY'}
            </button>
          </div>
          
          {/* Chart and Subcharts Container */}
          <div style={{
            height: `${450 + (usesMACD() ? 110 : 0) + (usesRSI() ? 110 : 0) + (usesMACD() && usesRSI() ? 10 : 0)}px`,
            minHeight: `${450 + (usesMACD() ? 110 : 0) + (usesRSI() ? 110 : 0) + (usesMACD() && usesRSI() ? 10 : 0)}px`,
            maxHeight: `${450 + (usesMACD() ? 110 : 0) + (usesRSI() ? 110 : 0) + (usesMACD() && usesRSI() ? 10 : 0)}px`,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Main Chart */}
            <div style={{ 
              height: '450px',
              backgroundColor: 'white',
              borderRadius: '4px',
              border: '1px solid #e1e5e9',
              overflow: 'hidden',
              marginBottom: usesMACD() || usesRSI() ? '10px' : '0'
            }}>
              <div 
                id="backtest-chart-container" 
                ref={containerRef}
                style={{ 
                  width: '100%', 
                  height: '100%'
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
            </div>
          </div>
          
          {/* Legend */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            marginTop: '10px',
            fontSize: '12px',
            color: '#666',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', backgroundColor: '#ff6b35' }}></div>
              <span>MA20</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '2px', backgroundColor: '#1890ff' }}></div>
              <span>MA100</span>
            </div>
            {usesMACD() && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '2px', backgroundColor: '#2196F3' }}></div>
                  <span>MACD</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '2px', backgroundColor: '#FF5722' }}></div>
                  <span>Signal</span>
                </div>
              </>
            )}
            {usesRSI() && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '2px', backgroundColor: '#FF9800' }}></div>
                  <span>RSI</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '2px', backgroundColor: '#4CAF50', opacity: 0.7 }}></div>
                  <span>RSI 30</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '20px', height: '2px', backgroundColor: '#F44336', opacity: 0.7 }}></div>
                  <span>RSI 70</span>
                </div>
              </>
            )}
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
      
      {/* Results and Trade History Section */}
      <div style={{ 
        display: 'flex', 
        gap: '20px',
        maxHeight: '300px',
        minHeight: '250px'
      }}>
        {/* Summary */}
        {backtestResult && (
          <div style={{ 
            flex: 1,
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
          flex: 2,
          background: 'white', 
          borderRadius: '8px', 
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-family-primary)' }}>
                        ${trade.price.toFixed(2)}
                      </td>
                      <td style={{ 
                        padding: '8px', 
                        textAlign: 'right', 
                        fontFamily: 'var(--font-family-primary)',
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
