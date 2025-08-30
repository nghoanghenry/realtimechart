"use client"

import { useState } from "react"
import { BarChart3, Settings, Grid3X3, TrendingUp, Repeat } from "lucide-react"
import CustomProChart from "../components/CustomProChart"

const SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', category: 'Major' },
  { symbol: 'ETHUSDT', name: 'Ethereum', category: 'Major' },
  { symbol: 'BNBUSDT', name: 'BNB', category: 'Major' },
  { symbol: 'ADAUSDT', name: 'Cardano', category: 'Major' },
  { symbol: 'SOLUSDT', name: 'Solana', category: 'Major' },
  { symbol: 'XRPUSDT', name: 'Ripple', category: 'Major' },
  { symbol: 'DOTUSDT', name: 'Polkadot', category: 'Major' },
  { symbol: 'LINKUSDT', name: 'Chainlink', category: 'Oracle' },
  { symbol: 'LTCUSDT', name: 'Litecoin', category: 'Payment' }
];

export default function MultiChartGrid() {
  const [chartCount, setChartCount] = useState(4);
  const [appliedChartCount, setAppliedChartCount] = useState(4);
  
  const handleApplyChartCount = () => {
    if (chartCount >= 1 && chartCount <= 9) {
      setAppliedChartCount(chartCount);
    }
  };

  const getGridCols = (count: number) => {
    if (count === 1) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 2;
    return 2;
  };

  const getChartHeight = (count: number) => {
    if (count === 1) return '600px';
    if (count <= 4) return '400px';
    return '350px';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Grid3X3 className="h-8 w-8 text-black" />
                <div>
                  <h1 className="text-2xl font-bold text-black">Multi Chart Dashboard</h1>
                  <p className="text-sm text-gray-600 mt-1">Monitor multiple cryptocurrency pairs simultaneously</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BarChart3 className="h-4 w-4" />
                  Currently showing: <span className="font-semibold text-black">{appliedChartCount}</span> chart(s)
                </div>
              </div>
            </div>
            {/* Header Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">Number of Charts:</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={chartCount}
                  onChange={(e) => setChartCount(Number.parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                />
              </div>
              <button
                onClick={handleApplyChartCount}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-1">

        {/* Charts Grid */}
        <div
          className="grid gap-1 mb-6"
          style={{
            gridTemplateColumns: `repeat(${getGridCols(appliedChartCount)}, 1fr)`,
          }}
        >
          {Array.from({ length: appliedChartCount }, (_, index) => {
            const symbolData = SYMBOLS[index % SYMBOLS.length];
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {/* Chart Header */}
                <div className="flex justify-between items-center p-5 bg-gray-50 border-b border-gray-200">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-black">{symbolData.symbol}</h3>
                    <div className="text-xs text-gray-500 mt-1">
                      {symbolData.name} • {symbolData.category}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium">1M</div>
                    <div className="px-2 py-1 bg-black text-white rounded text-xs font-semibold">Chart {index + 1}</div>
                  </div>
                </div>
                
                {/* Chart Content */}
                <div className="p-5">
                  <CustomProChart symbol={symbolData.symbol} interval="1m" height={getChartHeight(appliedChartCount)} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Shared realtime indicator */}
        <div className="my-6 rounded-lg flex items-center justify-center gap-2">
          <Repeat className="h-4 w-4" />
          <span className="text-sm font-medium">
            All charts sharing realtime data from single WebSocket connection
          </span>
        </div>

        {/* Info Footer */}
        <div className="bg-black text-white p-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5" />
            <h4 className="text-lg font-semibold">Multi Chart Features</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto">
            Monitor multiple cryptocurrency pairs simultaneously with real-time price data. Customize the number of
            charts (1-9) with automatic layout optimization and responsive design.
          </p>
        </div>
      </div>
    </div>
  )
}
