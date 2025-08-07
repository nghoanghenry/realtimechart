import { useState, useEffect, useRef } from 'react';
import CustomProChart from './CustomProChart';

const TIME_FRAMES = [
  { interval: '5m', label: '5 Minutes', icon: '⚡' },
  { interval: '4h', label: '4 Hours', icon: '📈' },
  { interval: '1d', label: 'Daily', icon: '📅' },
  { interval: '1w', label: 'Weekly', icon: '🗓️' }
];

interface SymbolOption {
  symbol: string;
  name: string;
  category: string;
}

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

interface MultiChartProps {
  selectedSymbol?: string;
}

// Symbol Autocomplete Component (inline)
function SymbolAutocomplete({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (symbol: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<SymbolOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  useEffect(() => {
    if (value.length === 0) {
      setFilteredOptions(POPULAR_SYMBOLS.slice(0, 10)); // Show top 10 when empty
    } else {
      const filtered = POPULAR_SYMBOLS.filter(option =>
        option.symbol.toLowerCase().includes(value.toLowerCase()) ||
        option.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredOptions(filtered.slice(0, 8)); // Limit to 8 results
    }
    setHighlightedIndex(-1);
  }, [value]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectOption = (option: SymbolOption) => {
    onChange(option.symbol);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Major': '#1890ff',
      'Meme': '#ff4747',
      'Layer 1': '#52c41a',
      'Layer 2': '#722ed1',
      'DeFi': '#fa8c16',
      'Oracle': '#13c2c2',
      'Payment': '#f759ab',
      'Storage': '#a0d911'
    };
    return colors[category] || '#666';
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder="Search symbols..."
        style={{
          padding: '8px 12px',
          border: isOpen ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: '6px',
          fontSize: '14px',
          width: '200px',
          textTransform: 'uppercase',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
          marginTop: '2px'
        }}>
          {filteredOptions.map((option, index) => (
            <div
              key={option.symbol}
              onClick={() => handleSelectOption(option)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                backgroundColor: index === highlightedIndex ? '#f0f8ff' : 'white',
                borderBottom: index < filteredOptions.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.1s ease'
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: '14px',
                  color: '#262626'
                }}>
                  {option.symbol}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  marginTop: '2px'
                }}>
                  {option.name}
                </div>
              </div>
              <div style={{
                padding: '2px 6px',
                backgroundColor: getCategoryColor(option.category),
                color: 'white',
                borderRadius: '3px',
                fontSize: '10px',
                fontWeight: 600
              }}>
                {option.category}
              </div>
            </div>
          ))}
          
          {value.length > 0 && !filteredOptions.some(opt => opt.symbol === value) && (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid #f0f0f0',
              backgroundColor: '#f9f9f9',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              Press Enter to use "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MultiChart({ selectedSymbol = 'BTCUSDT' }: MultiChartProps) {
  const [symbol, setSymbol] = useState(selectedSymbol);

  // Update symbol when prop changes
  useEffect(() => {
    setSymbol(selectedSymbol);
  }, [selectedSymbol]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{ margin: 0, color: '#262626' }}>
          Multi-Timeframe Analysis: {symbol}
        </h1>
        
        {/* Symbol autocomplete để có thể thay đổi coin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 500, color: '#666' }}>Symbol:</label>
          <SymbolAutocomplete
            value={symbol}
            onChange={setSymbol}
          />
        </div>
      </div>
      
      {/* Shared realtime indicator */}
      <div style={{
        marginBottom: '20px',
        padding: '12px 16px',
        backgroundColor: '#e6f7ff',
        borderRadius: '6px',
        border: '1px solid #91d5ff',
        textAlign: 'center'
      }}>
        <span style={{ color: '#0050b3', fontSize: '14px', fontWeight: 500 }}>
          🔄 All charts sharing realtime data from single WebSocket connection for {symbol}
        </span>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', 
        gap: '2px'
      }}>
        {TIME_FRAMES.map((timeFrame, index) => (
          <div key={`${symbol}-${timeFrame.interval}-${index}`} style={{
            border: '1px solid #e8e8e8', 
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ 
                margin: 0, 
                color: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{timeFrame.icon}</span>
                {symbol} - {timeFrame.label}
              </h3>
              
              <div style={{
                padding: '6px 10px',
                backgroundColor: getTimeframeBadgeColor(timeFrame.interval),
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                color: 'white',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                {timeFrame.interval.toUpperCase()}
              </div>
            </div>
            
            <CustomProChart 
              key={`chart-${symbol}-${timeFrame.interval}`}
              symbol={symbol} 
              interval={timeFrame.interval}
              height="400px"
            />
          </div>
        ))}
      </div>
      
      {/* Timeframe explanation */}
      <div style={{
        marginTop: '30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: '#e6f7ff',
          borderRadius: '8px',
          border: '1px solid #91d5ff'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0050b3', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⚡ 5 Minutes - Scalping
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Quick trades, high frequency, short-term momentum
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#f6ffed',
          borderRadius: '8px',
          border: '1px solid #b7eb8f'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#389e0d', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📈 4 Hours - Swing Trading
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Medium-term trends, swing positions, technical analysis
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#fff7e6',
          borderRadius: '8px',
          border: '1px solid #ffd591'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#d48806', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📅 Daily - Position Trading
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Major trends, position trades, fundamental analysis
          </p>
        </div>
        
        <div style={{
          padding: '16px',
          backgroundColor: '#f9f0ff',
          borderRadius: '8px',
          border: '1px solid #d3adf7'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#722ed1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            🗓️ Weekly - Investment
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Long-term trends, macro analysis, investment decisions
          </p>
        </div>
      </div>
      
      {/* Popular symbols quick access */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #e8e8e8'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#262626', fontSize: '14px' }}>
          🚀 Quick Access - Popular Symbols:
        </h4>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap' 
        }}>
          {POPULAR_SYMBOLS.slice(0, 8).map((option) => (
            <button
              key={option.symbol}
              onClick={() => setSymbol(option.symbol)}
              style={{
                padding: '6px 12px',
                border: symbol === option.symbol ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '4px',
                backgroundColor: symbol === option.symbol ? '#e6f7ff' : 'white',
                color: symbol === option.symbol ? '#1890ff' : '#666',
                fontSize: '12px',
                fontWeight: symbol === option.symbol ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (symbol !== option.symbol) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (symbol !== option.symbol) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {option.symbol.replace('USDT', '')}
            </button>
          ))}
        </div>
      </div>
      
      {/* Info footer */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f6f8fa',
        borderRadius: '8px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>
          📊 Analyzing <strong style={{ color: '#1890ff' }}>{symbol}</strong> across multiple timeframes
        </p>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
          5m for scalping • 4h for swing trading • Daily for position trades • Weekly for long-term investment
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#999' }}>
          🔄 Single WebSocket connection shared across all charts for optimal performance
        </p>
      </div>
    </div>
  );
}

// Helper function để lấy màu badge theo timeframe
function getTimeframeBadgeColor(interval: string): string {
  const colors: Record<string, string> = {
    '5m': '#52c41a',   // Green - Fast/Scalping
    '4h': '#1890ff',   // Blue - Medium/Swing
    '1d': '#fa8c16',   // Orange - Daily/Position
    '1w': '#722ed1'    // Purple - Weekly/Investment
  };
  return colors[interval] || '#666';
}