import { Link, useLocation } from 'react-router-dom';

export default function AuthHeader() {
  const location = useLocation();

  const navButtonStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
    backgroundColor: isActive ? '#e6f7ff' : 'white',
    color: isActive ? '#1890ff' : '#666',
    borderRadius: '6px',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: isActive ? 600 : 400,
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
        
        {/* Auth Navigation */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link
            to="/login"
            style={navButtonStyle(location.pathname === '/login')}
            onMouseOver={(e) => {
              if (location.pathname !== '/login') {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/login') {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            🔑 Login
          </Link>
          
          <Link
            to="/register"
            style={navButtonStyle(location.pathname === '/register')}
            onMouseOver={(e) => {
              if (location.pathname !== '/register') {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.color = '#1890ff';
              }
            }}
            onMouseOut={(e) => {
              if (location.pathname !== '/register') {
                e.currentTarget.style.borderColor = '#d9d9d9';
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            📝 Register
          </Link>
        </div>
      </div>
    </header>
  );
}
