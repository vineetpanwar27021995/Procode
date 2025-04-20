import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Button, Input } from '../../components';
import { FaGoogle as GoogleIcon, FaFacebook as FacebookIcon } from 'react-icons/fa';
import { lightTheme, darkTheme } from '../../styles/themes';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbarStore } from '../../stores/snackbarStore';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loading, error } = useAuthStore();
    const { darkMode } = useThemeStore();
    const { showSnackbar } = useSnackbarStore();
    const navigate = useNavigate();
    const location = useLocation();
  
    useEffect(() => {
      if (location.state?.verified) {
        showSnackbar('Email verified successfully! You can now login.', 'success');
        navigate('.', { replace: true, state: {} });
      }
    }, [location, navigate, showSnackbar]);
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await login(email, password);
        showSnackbar('Login successful!', 'success');
        // navigate('/dashboard');
      } catch (error) {
        showSnackbar(error.message || 'Login failed', 'error');
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
      <h1>Login</h1>
      <p>Please log in into your account</p>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Sign in'}
        </Button>
        
        <Button 
          variant="text"
          onClick={() => navigate('/forgot-password')}
        >
          Forgot password?
        </Button>
      </form>
      
      <div style={{ marginTop: 20 }}>
        <Button 
          variant="outlined"
          startIcon={<GoogleIcon />}
          style={{ borderColor: '#4280EF', color: '#4280EF' }}
        >
          Sign in with Google
        </Button>
        
        <Button 
          variant="outlined"
          startIcon={<FacebookIcon />}
          style={{ marginTop: 10, borderColor: '#4280EF', color: '#4280EF' }}
        >
          Sign in with Facebook
        </Button>
      </div>
      
    </div>
  );
};

export default Login;