import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import SingleChartPage from './pages/SingleChartPage';
import MultiChartGridPage from './pages/MultiChartGridPage';
import MultiChartPage from './pages/MultiChartPage';
import BacktestPage from './pages/BacktestPage';
import AuthPage from './pages/AuthPage';
import LoginPageWrapper from './pages/LoginPageWrapper';
import RegisterPageWrapper from './pages/RegisterPageWrapper';
import VipUpgradePage from './pages/VipUpgradePage';
import AdminPage from './pages/AdminPage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login page instead of AuthPage
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Main App Content
function AppContent() {
  const { user } = useAuth();
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {user && <Header />}
      
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <SingleChartPage />
          </ProtectedRoute>
        } />
        <Route path="/multichart" element={
          <ProtectedRoute>
            <MultiChartGridPage />
          </ProtectedRoute>
        } />
        <Route path="/multitimeframechart" element={
          <ProtectedRoute>
            <MultiChartPage />
          </ProtectedRoute>
        } />
        <Route path="/backtest" element={
          <ProtectedRoute>
            <BacktestPage />
          </ProtectedRoute>
        } />
        <Route path="/vip" element={
          <ProtectedRoute>
            <VipUpgradePage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route path="/register" element={<RegisterPageWrapper />} />
        {/* Catch all route - redirect to login if not authenticated, home if authenticated */}
        <Route path="*" element={
          <ProtectedRoute>
            <Navigate to="/" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

// Main App Component with Auth Provider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}