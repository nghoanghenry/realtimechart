import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthHeader from '../components/AuthHeader';
import LoginPage from './LoginPage';

const LoginPageWrapper = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSwitchToRegister = () => {
    navigate('/register');
  };

  return (
    <>
      <AuthHeader />
      <LoginPage onSwitchToRegister={handleSwitchToRegister} />
    </>
  );
};

export default LoginPageWrapper;
