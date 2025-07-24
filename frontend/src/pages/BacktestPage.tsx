import BacktestChart from '../components/BacktestChart';

export default function BacktestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f6fa',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        <BacktestChart />
      </div>
    </div>
  );
}
