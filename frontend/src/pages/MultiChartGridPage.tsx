import { useState } from 'react';
import CustomProChart from '../components/CustomProChart';

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
    if (count <= 6) return 3;
    return 3; // Max 3 columns for better readability
  };

  const getChartHeight = (count: number) => {
    if (count === 1) return '600px';
    if (count <= 4) return '400px';
    return '350px';
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5', 
      padding: '0' 
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* Header Controls */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{ 
              margin: 0, 
              color: '#262626',
              fontSize: '24px',
              fontWeight: 600
            }}>
              Multi Chart Dashboard
            </h2>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{ 
                fontSize: '13px', 
                color: '#666', 
                display: 'block', 
                marginBottom: '6px',
                fontWeight: 500
              }}>
                Number of Charts:
              </label>
              <input
                type="number"
                min="1"
                max="9"
                value={chartCount}
                onChange={(e) => setChartCount(parseInt(e.target.value) || 1)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  width: '80px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1890ff'}
                onBlur={(e) => e.target.style.borderColor = '#d9d9d9'}
              />
            </div>
            
            <button
              onClick={handleApplyChartCount}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                marginTop: '20px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
            >
              Apply Changes
            </button>
            
            <div style={{ 
              marginLeft: '20px',
              color: '#666',
              fontSize: '13px',
              marginTop: '20px'
            }}>
              Currently showing: <strong style={{ color: '#1890ff' }}>{appliedChartCount}</strong> chart(s)
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${getGridCols(appliedChartCount)}, 1fr)`,
          gap: '20px',
          gridAutoRows: 'auto'
        }}>
          {Array.from({ length: appliedChartCount }, (_, index) => {
            const symbolData = SYMBOLS[index % SYMBOLS.length];
            return (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  border: '1px solid #e8e8e8'
                }}
              >
                {/* Chart Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #e8e8e8'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{
                      margin: 0,
                      color: '#262626',
                      fontSize: '16px',
                      fontWeight: 600
                    }}>
                      {symbolData.symbol}
                    </h3>
                    <div style={{
                      fontSize: '12px',
                      color: '#8c8c8c',
                      marginTop: '2px'
                    }}>
                      {symbolData.name} • {symbolData.category}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: '#f0f2f5',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#666',
                      fontWeight: 500,
                      textTransform: 'uppercase'
                    }}>
                      1m
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: '#e6f7ff',
                      color: '#1890ff',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}>
                      Chart {index + 1}
                    </div>
                  </div>
                </div>
                
                {/* Chart Content */}
                <div style={{ padding: '16px' }}>
                  <CustomProChart
                    symbol={symbolData.symbol}
                    interval="1m"
                    height={getChartHeight(appliedChartCount)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Footer */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginTop: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <h4 style={{
              margin: 0,
              color: '#262626',
              fontSize: '16px',
              fontWeight: 600
            }}>
              Multi Chart Features
            </h4>
          </div>
          <p style={{
            margin: '0 auto',
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '600px'
          }}>
            Monitor multiple cryptocurrency pairs simultaneously with real-time price data. 
            Customize the number of charts (1-9) with automatic layout optimization and responsive design.
          </p>
        </div>
      </div>
    </div>
  );
}
