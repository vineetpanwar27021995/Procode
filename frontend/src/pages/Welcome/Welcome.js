import React from 'react';
import { useThemeStore } from '../../stores/themeStore';
import { Button } from '../../components';
import { useNavigate } from 'react-router-dom';
import { lightTheme, darkTheme } from '../../styles/themes';

const Welcome = () => {
  const { darkMode } = useThemeStore();
  const navigate = useNavigate();
  
  return (
    <div style={{ 
      background: darkMode ? darkTheme.background : lightTheme.background,
      color: darkMode ? darkTheme.text : lightTheme.text,
      height: '100vh',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1>Welcome</h1>
      <p>Let's get started</p>
      
      <Button 
        onClick={() => navigate('/login')}
        style={{ marginTop: 20 }}
      >
        Existing customer / Get started
      </Button>
      
      <Button 
        variant="outlined"
        onClick={() => navigate('/register')}
        style={{ marginTop: 10 }}
      >
        New customer? Create new account
      </Button>
    </div>
  );
};

export default Welcome;