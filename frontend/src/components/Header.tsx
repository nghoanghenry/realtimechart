import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const getActiveView = () => {
    if (location.pathname === '/') return 'single';
    if (location.pathname === '/multichart') return 'multichart';
    if (location.pathname === '/multitimeframechart') return 'multi';
    if (location.pathname === '/backtest') return 'backtest';
    return 'single';
  };

  const activeView = getActiveView();

  const navButtonStyle = (viewType: string) => ({
    padding: '8px 16px',
    border: activeView === viewType ? '2px solid #1890ff' : '1px solid #d9d9d9',
    backgroundColor: activeView === viewType ? '#e6f7ff' : 'white',
    color: activeView === viewType ? '#1890ff' : '#666',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: activeView === viewType ? 600 : 400,
    transition: 'all 0.3s ease',
    display: 'inline-block'
  });

  return (
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
          <Link
            to="/"
            style={navButtonStyle('single')}
            onMouseOver={(e) => {
              if (activeView !== 'single') {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }
            }}
            onMouseOut={(e) => {
              if (activeView !== 'single') {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            📈 Single Chart
          </Link>
          
          <Link
            to="/multichart"
            style={navButtonStyle('multichart')}
            onMouseOver={(e) => {
              if (activeView !== 'multichart') {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }
            }}
            onMouseOut={(e) => {
              if (activeView !== 'multichart') {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            📊 Multi Chart
          </Link>
          
          <Link
            to="/multitimeframechart"
            style={navButtonStyle('multi')}
            onMouseOver={(e) => {
              if (activeView !== 'multi') {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }
            }}
            onMouseOut={(e) => {
              if (activeView !== 'multi') {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            📊 Multi Timeframe Chart
          </Link>
          
          <Link
            to="/backtest"
            style={navButtonStyle('backtest')}
            onMouseOver={(e) => {
              if (activeView !== 'backtest') {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }
            }}
            onMouseOut={(e) => {
              if (activeView !== 'backtest') {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            🔬 Backtest
          </Link>
        </div>
      </div>
    </header>
  );
}
