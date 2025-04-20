import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { Button, Input } from '../../components';
import { useNavigate } from 'react-router-dom';
import { lightTheme, darkTheme } from '../../styles/themes';
import { useSnackbarStore } from '../../stores/snackbarStore';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const { register, loading, error } = useAuthStore();
  const { darkMode } = useThemeStore();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbarStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) {
      showSnackbar('Please agree to the terms and conditions', 'error');
      return;
    }
    
    try {
      await register(name, email, password);
      showSnackbar('Registration successful! Verification email sent.', 'success');
      navigate('/verify', { state: { email } });
    } catch (error) {
      showSnackbar(error.message || 'Registration failed', 'error');
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
      
      <h1>Sign Up</h1>
      <p>Please create a new account</p>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        
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
        
        <div style={{ marginTop: 10 }}>
          <input 
            type="checkbox" 
            className='checkbox checkbox-primary'
            checked={agree} 
            onChange={(e) => setAgree(e.target.checked)} 
          />
          <span>Agree the terms of use and privacy policy</span>
        </div>
        
        <Button type="submit" disabled={loading || !agree} style={{ marginTop: 20 }}>
          {loading ? 'Loading...' : 'Sign up'}
        </Button>
      </form>
      
    </div>
  );
};

export default Register;