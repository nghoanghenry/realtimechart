import { useState } from 'react';
import MultiChart from '../components/MultiChart';

export default function MultiChartPage() {
  const [selectedSymbol] = useState('BTCUSDT');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '24px' }}>
      <MultiChart selectedSymbol={selectedSymbol} />
    </div>
  );
}
