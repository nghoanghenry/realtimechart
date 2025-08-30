"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { TrendingUp, Calendar, CalendarDays, Zap, Search, BarChart3, Repeat } from "lucide-react"
import CustomProChart from "./CustomProChart"

const TIME_FRAMES = [
  { interval: "5m", label: "5 Minutes", icon: Zap },
  { interval: "4h", label: "4 Hours", icon: TrendingUp },
  { interval: "1d", label: "Daily", icon: Calendar },
  { interval: "1w", label: "Weekly", icon: CalendarDays },
]

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
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder="Search symbols..."
          className={`pl-10 pr-4 py-2 border-2 rounded-lg text-sm w-56 uppercase outline-none transition-all duration-200 ${
            isOpen ? "border-black shadow-lg" : "border-gray-200 hover:border-gray-300"
          }`}
        />
      </div>

      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto mt-1">
          {filteredOptions.map((option, index) => (
            <div
              key={option.symbol}
              onClick={() => handleSelectOption(option)}
              className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center transition-colors ${
                index === highlightedIndex ? "bg-gray-50" : "hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex flex-col flex-1">
                <div className="font-semibold text-sm text-black">{option.symbol}</div>
                <div className="text-xs text-gray-500 mt-0.5">{option.name}</div>
              </div>
              <div
                className="px-2 py-1 rounded text-white text-xs font-semibold"
                style={{ backgroundColor: getCategoryColor(option.category) }}
              >
                {option.category}
              </div>
            </div>
          ))}

          {value.length > 0 && !filteredOptions.some((opt) => opt.symbol === value) && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 text-center">
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-black" />
                <div>
                  <h1 className="text-2xl font-bold text-black">Multi-Timeframe Analysis</h1>
                  <p className="text-sm text-gray-600 mt-1">Analyzing {symbol} across multiple timeframes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Symbol:</label>
                <SymbolAutocomplete value={symbol} onChange={setSymbol} />
              </div>
            </div>
            {/* Popular symbols quick access */}
            <div className="bg-white rounded-lg flex">
              <h4 className="flex items-center gap-2 text-base font-semibold text-black mr-2">
                Popular Symbols:
              </h4>
              <div className="flex gap-2 flex-wrap">
                {POPULAR_SYMBOLS.slice(0, 8).map((option) => (
                  <button
                    key={option.symbol}
                    onClick={() => setSymbol(option.symbol)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      symbol === option.symbol ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.symbol.replace("USDT", "")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto">
        <div className="mt-1 grid grid-cols-1 xl:grid-cols-2 gap-1">
          {TIME_FRAMES.map((timeFrame, index) => {
            const IconComponent = timeFrame.icon
            return (
              <div
                key={`${symbol}-${timeFrame.interval}-${index}`}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                {/* Chart Header */}
                <div className="flex justify-between items-center p-5 bg-gray-50 border-b border-gray-200">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-black">
                    <IconComponent className="h-5 w-5" />
                    <span className="truncate">
                      {symbol} - {timeFrame.label}
                    </span>
                  </h3>
                  <div
                    className="px-3 py-1 rounded-md text-xs font-bold text-white"
                    style={{ backgroundColor: getTimeframeBadgeColor(timeFrame.interval) }}
                  >
                    {timeFrame.interval.toUpperCase()}
                  </div>
                </div>
                {/* Chart Content */}
                <div className="p-5">
                  <CustomProChart
                    key={`chart-${symbol}-${timeFrame.interval}`}
                    symbol={symbol}
                    interval={timeFrame.interval}
                    height="400px"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Timeframe explanation */}
        {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="flex items-center gap-2 font-semibold text-black mb-2">
              <Zap className="h-4 w-4" />5 Minutes - Scalping
            </h4>
            <p className="text-sm text-gray-600">Quick trades, high frequency, short-term momentum</p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="flex items-center gap-2 font-semibold text-black mb-2">
              <TrendingUp className="h-4 w-4" />4 Hours - Swing Trading
            </h4>
            <p className="text-sm text-gray-600">Medium-term trends, swing positions, technical analysis</p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="flex items-center gap-2 font-semibold text-black mb-2">
              <Calendar className="h-4 w-4" />
              Daily - Position Trading
            </h4>
            <p className="text-sm text-gray-600">Major trends, position trades, fundamental analysis</p>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="flex items-center gap-2 font-semibold text-black mb-2">
              <CalendarDays className="h-4 w-4" />
              Weekly - Investment
            </h4>
            <p className="text-sm text-gray-600">Long-term trends, macro analysis, investment decisions</p>
          </div>
        </div> */}

        {/* Shared realtime indicator */}
        <div className="my-6 rounded-lg flex items-center justify-center gap-2">
          <Repeat className="h-4 w-4" />
          <span className="text-sm font-medium">
            All charts sharing realtime data from single WebSocket connection for {symbol}
          </span>
        </div>

        {/* Info footer */}
        <div className="mt-6 p-5 bg-black text-white text-center">
          <p className="font-semibold mb-2">
            Analyzing <span className="text-yellow-400">{symbol}</span> across multiple timeframes
          </p>
          <p className="text-sm text-gray-300 mb-2">
            5m for scalping • 4h for swing trading • Daily for position trades • Weekly for long-term investment
          </p>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Repeat className="h-3 w-3" />
            Single WebSocket connection shared across all charts for optimal performance
          </p>
        </div>
      </div>
    </div>
  )
}

// Helper function để lấy màu badge theo timeframe
function getTimeframeBadgeColor(interval: string): string {
  const colors: Record<string, string> = {
    "5m": "#16a34a", // Green - Fast/Scalping
    "4h": "#000000", // Black - Medium/Swing
    "1d": "#ea580c", // Orange - Daily/Position
    "1w": "#7c3aed", // Purple - Weekly/Investment
  }
  return colors[interval] || "#374151"
}
