import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { IoChevronDown } from 'react-icons/io5';

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const navigationItems = [
    { path: '/', label: 'Single Chart', key: 'single' },
    { path: '/multichart', label: 'Multi Chart', key: 'multichart' },
    { path: '/multitimeframechart', label: 'Multi Timeframe', key: 'multi' },
    { path: '/backtest', label: 'Backtest', key: 'backtest' },
  ];

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="bg-white/30 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="relative max-w-full mx-auto px-6 flex justify-between items-center min-h-[50px]">
        <div className="flex-shrink-0">
          <h1 className="m-0 text-black text-2xl font-bold tracking-tight drop-shadow-sm">
            TradeX
          </h1>
        </div>

        <nav className="flex items-center gap-6 flex-1 justify-end">
          <div className="flex items-center gap-2 p-1">
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`
                  px-5 py-1 rounded-xl text-sm font-medium 
                  transition-all duration-300 ease-out relative whitespace-nowrap
                  hover:text-black hover:bg-gray-200 hover:-translate-y-0.5
                  ${activeView === item.key 
                    ? 'text-black bg-gray-100 font-semibold shadow-lg' 
                    : 'text-gray-700'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}

            {/* VIP Button - Hide for admin */}
            {user?.role !== 'admin' && (
              <Link
                to="/vip"
                className={`
                  px-5 py-1 rounded-xl text-sm font-semibold text-gray-800
                  bg-gradient-to-br from-yellow-400 to-yellow-300
                  border border-yellow-400/30 shadow-lg shadow-yellow-400/30
                  transition-all duration-300 ease-out whitespace-nowrap
                  hover:from-yellow-300 hover:to-yellow-400 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-yellow-400/40
                  ${activeView === 'vip' 
                    ? 'from-yellow-300 to-yellow-400 shadow-xl shadow-yellow-400/50' 
                    : ''
                  }
                `}
              >
                {user?.role === 'vip' ? 'VIP Member' : 'Upgrade VIP'}
              </Link>
            )}

            {/* Admin Button - Only show for admin users */}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`
                  px-5 py-1 rounded-xl text-sm font-semibold text-white
                  bg-gradient-to-br from-red-500 to-red-600
                  border border-red-500/30 shadow-lg shadow-red-500/30
                  transition-all duration-300 ease-out whitespace-nowrap
                  hover:from-red-600 hover:to-red-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40
                  ${activeView === 'admin' 
                    ? 'from-red-600 to-red-500 shadow-xl shadow-red-500/50' 
                    : ''
                  }
                `}
              >
                Admin Panel
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 pl-6 border-l border-gray-300 relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 cursor-pointer">
              <span className="text-gray-700 text-sm font-normal whitespace-nowrap">Welcome,</span>
              <span className="text-gray-900 font-semibold">{user?.username}</span>
              <button 
                onClick={toggleDropdown} 
                className="bg-transparent border-none text-gray-600 cursor-pointer p-1 rounded transition-all duration-300 ease-out flex items-center justify-center hover:bg-gray-100 hover:text-gray-900"
                aria-expanded={isDropdownOpen}
              >
                <IoChevronDown 
                  className={`transition-transform duration-300 ease-out ${isDropdownOpen ? 'rotate-180' : ''}`}
                  size={16}
                />
              </button>
            </div>
            
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 min-w-[160px] overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                <Link 
                  to="/account" 
                  className="block w-full px-4 py-3 text-gray-800 text-sm font-medium border-none bg-transparent cursor-pointer transition-colors duration-200 text-left hover:bg-gray-50 active:bg-gray-100"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  Tài khoản
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="block w-full px-4 py-3 text-gray-800 text-sm font-medium border-none bg-transparent cursor-pointer transition-colors duration-200 text-left hover:bg-gray-50 active:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Responsive styles for mobile */}
      <style>{`
        @media (max-width: 1200px) {
          .container {
            padding: 0 16px;
          }
        }
        
        @media (max-width: 992px) {
          .title {
            font-size: 20px;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            flex-direction: column;
            gap: 16px;
            padding: 16px;
            min-height: auto;
          }
          
          .navigation {
            width: 100%;
            justify-content: space-between;
          }
          
          .navLinks {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .userSection {
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            padding-left: 0;
            padding-top: 16px;
            width: 100%;
            justify-content: center;
          }
          
          .dropdown {
            right: 50%;
            transform: translateX(50%);
          }
        }
        
        @media (max-width: 480px) {
          .title {
            font-size: 18px;
            text-align: center;
          }
          
          .welcomeText {
            font-size: 13px;
          }
          
          .dropdown {
            min-width: 140px;
          }
        }
      `}</style>
    </header>
  );
}
