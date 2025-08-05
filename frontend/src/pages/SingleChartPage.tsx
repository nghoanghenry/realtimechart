import { useState } from 'react';
import CustomProChart from '../components/CustomProChart';
import SentimentNews from '../components/SentimentNews';

export default function SingleChartPage() {
  const [selectedSymbol] = useState('BTCUSDT');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '24px' }}>
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
        <div className="flex">
          <CustomProChart 
            symbol={selectedSymbol} 
            interval="1m"
            height="700px"
          />
          <SentimentNews/>
        </div>
      </div>
    </div>
  );
}
