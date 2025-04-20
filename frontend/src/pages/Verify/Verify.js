import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Button, Input } from '../../components';
import { lightTheme, darkTheme } from '../../styles/themes';
import { useSnackbarStore } from '../../stores/snackbarStore';
import { useLocation, useNavigate } from 'react-router-dom';

const Verify = () => {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const { verifyCode, loading, resendVerification } = useAuthStore();
    const { darkMode } = useThemeStore();
    const { showSnackbar } = useSnackbarStore();
    const navigate = useNavigate();
    const location = useLocation();
  
    useEffect(() => {
      if (location.state?.email) {
        setEmail(location.state.email);
      } else {
        showSnackbar('Please register first', 'error');
        navigate('/register');
      }
    }, [location, navigate, showSnackbar]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await verifyCode(code);
        showSnackbar('Email verified successfully! You can now login.', 'success');
        navigate('/login');
      } catch (error) {
        showSnackbar(error.message || 'Verification failed', 'error');
      }
    };
  
    const handleResendCode = async () => {
      try {
        await resendVerification(email);
        showSnackbar('Verification code resent successfully!', 'success');
      } catch (error) {
        showSnackbar(error.message || 'Failed to resend code', 'error');
      }
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
      
      <h1>Verify</h1>
      <p>Enter 4 digit code</p>
      <p>A four-digit code should have come to your email address that you indicated.</p>
      
      <form onSubmit={handleSubmit}>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={4}
        />
        
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <Button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Confirm'}
          </Button>
          
          <Button variant="outlined" onClick={() => navigate('/login')}>
            Cancel
          </Button>
        </div>
      </form>
      <Button 
        variant="text" 
        onClick={handleResendCode} 
        style={{ marginTop: 10 }}
      >
        Resend Code
      </Button>
    </div>
  );
};

export default Verify;