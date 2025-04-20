import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Button, Input } from '../../components';
import { useNavigate } from 'react-router-dom';
import { lightTheme, darkTheme } from '../../styles/themes';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const { forgotPassword, loading, error } = useAuthStore();
  const { darkMode } = useThemeStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword(email);
    navigate('/verify');
  };
  
  return (
    <div style={{ 
      background: darkMode ? darkTheme.background : lightTheme.background,
      color: darkMode ? darkTheme.text : lightTheme.text,
      height: '100vh',
      padding: 20
    }}>
      <Button variant="text" onClick={() => navigate(-1)}>
        Back
      </Button>
      
      <h1>Forgot password</h1>
      <p>Enter your email for the verification process, we will send code to your email</p>
      
      <form onSubmit={handleSubmit}>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Type something longer here..."
        />
        
        <Button type="submit" disabled={loading} style={{ marginTop: 20 }}>
          {loading ? 'Loading...' : 'Continue'}
        </Button>
      </form>
      
    </div>
  );
};

export default ForgotPassword;