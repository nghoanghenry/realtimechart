import { useState, useEffect, useRef } from 'react';

interface SymbolOption {
  symbol: string;
  name: string;
  category: string;
}

interface SymbolAutocompleteProps {
  value: string;
  onChange: (symbol: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
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

export default function SymbolAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter symbol (e.g., BTCUSDT)",
  style = {}
}: SymbolAutocompleteProps) {
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
    <div ref={dropdownRef} style={{ position: 'relative', ...style }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          padding: '8px 12px',
          border: isOpen ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: '6px',
          fontSize: '14px',
          width: '150px',
          textTransform: 'uppercase',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          ...style
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