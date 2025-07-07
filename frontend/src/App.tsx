import { useState } from 'react';
import CustomProChart from './components/CustomProChart';
import MultiChart from './components/MultiChart';

export default function App() {
  const [view, setView] = useState<'single' | 'multi'>('single');
  const [selectedSymbol] = useState('BTCUSDT');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Header với navigation buttons */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e8e8e8',
        padding: '16px 24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ 
            margin: 0, 
            color: '#1890ff',
            fontSize: '24px',
            fontWeight: 600
          }}>
            Crypto Trading Dashboard
          </h1>
          
          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setView('single')}
              style={{
                padding: '8px 16px',
                border: view === 'single' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                backgroundColor: view === 'single' ? '#e6f7ff' : 'white',
                color: view === 'single' ? '#1890ff' : '#666',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: view === 'single' ? 600 : 400,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (view !== 'single') {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.color = '#1890ff';
                }
              }}
              onMouseOut={(e) => {
                if (view !== 'single') {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#666';
                }
              }}
            >
              📈 Single Chart
            </button>
            
            <button
              onClick={() => setView('multi')}
              style={{
                padding: '8px 16px',
                border: view === 'multi' ? '2px solid #1890ff' : '1px solid #d9d9d9',
                backgroundColor: view === 'multi' ? '#e6f7ff' : 'white',
                color: view === 'multi' ? '#1890ff' : '#666',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: view === 'multi' ? 600 : 400,
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (view !== 'multi') {
                  e.currentTarget.style.borderColor = '#1890ff';
                  e.currentTarget.style.color = '#1890ff';
                }
              }}
              onMouseOut={(e) => {
                if (view !== 'multi') {
                  e.currentTarget.style.borderColor = '#d9d9d9';
                  e.currentTarget.style.color = '#666';
                }
              }}
            >
              📊 Multi Chart
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: '24px' }}>
        {view === 'single' ? (
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: 0, color: '#262626' }}>
                Live Trading Chart
              </h2>
            </div>
            <CustomProChart 
              symbol={selectedSymbol} 
              interval="1m"
              height="700px"
            />
          </div>
        ) : (
          // Truyền selectedSymbol vào MultiChart
          <MultiChart selectedSymbol={selectedSymbol} />
        )}
      </main>
    </div>
  );
}