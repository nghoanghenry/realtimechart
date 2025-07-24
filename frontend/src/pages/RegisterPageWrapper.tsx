import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthHeader from '../components/AuthHeader';
import RegisterPage from './RegisterPage';

const RegisterPageWrapper = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);
  
  const handleSwitchToLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <AuthHeader />
      <RegisterPage onSwitchToLogin={handleSwitchToLogin} />
    </>
  );
};

export default RegisterPageWrapper;
