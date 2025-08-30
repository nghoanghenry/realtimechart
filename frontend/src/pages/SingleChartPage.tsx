import { useState } from 'react';
import CustomProChart from '../components/CustomProChart';
import SentimentNews from '../components/SentimentNews';
import PredictionBlock from '../components/PredictionBlock';

export default function SingleChartPage() {
  const [selectedSymbol] = useState('BTCUSDT');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '44px' }}>
      <div style={{ 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
      className='bg-white'
      >
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
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 w-full">
          <div className="md:col-span-6">
            <CustomProChart
              symbol={selectedSymbol}
              interval="1m"
              height="700px"
            />
          </div>
          <div className="flex flex-col col-span-2 gap-4 pr-4">
            <PredictionBlock/>
            <SentimentNews/>
          </div>
        </div>
      </div>
    </div>
  );
}
