import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const getActiveView = () => {
    if (location.pathname === '/') return 'single';
    if (location.pathname === '/multichart') return 'multichart';
    if (location.pathname === '/multitimeframechart') return 'multi';
    if (location.pathname === '/backtest') return 'backtest';
    if (location.pathname === '/vip') return 'vip';
    if (location.pathname === '/admin') return 'admin';
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

  const handleLogout = () => {
    logout();
  };

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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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

          {/* VIP Upgrade Button - Special styling - Hide for admin */}
          {user?.role !== 'admin' && (
            <Link
              to="/vip"
              style={{
                ...navButtonStyle('vip'),
                background: activeView === 'vip' 
                  ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                transform: activeView === 'vip' ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseOver={(e) => {
                if (activeView !== 'vip') {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
                }
              }}
              onMouseOut={(e) => {
                if (activeView !== 'vip') {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              ⭐ {user?.role === 'vip' ? 'VIP Member' : 'Nâng cấp VIP'}
            </Link>
          )}

          {/* Admin Button - Only show for admin users */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              style={{
                ...navButtonStyle('admin'),
                background: activeView === 'admin' 
                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)' 
                  : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
                transform: activeView === 'admin' ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseOver={(e) => {
                if (activeView !== 'admin') {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(240, 147, 251, 0.6)';
                }
              }}
              onMouseOut={(e) => {
                if (activeView !== 'admin') {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 147, 251, 0.4)';
                }
              }}
            >
              🛠️ Admin
            </Link>
          )}

          {/* User Info and Logout */}
          <div style={{ 
            marginLeft: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            paddingLeft: '20px',
            borderLeft: '1px solid #e8e8e8'
          }}>
            <span style={{ 
              color: '#666', 
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Welcome, {user?.username}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                border: '1px solid #ff4d4f',
                backgroundColor: 'white',
                color: '#ff4d4f',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#ff4d4f';
                (e.target as HTMLButtonElement).style.color = 'white';
              }}
              onMouseOut={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                (e.target as HTMLButtonElement).style.color = '#ff4d4f';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
