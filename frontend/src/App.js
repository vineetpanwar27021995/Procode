import React, { useEffect } from 'react';
import { useThemeStore } from './stores/themeStore';
import { lightTheme, darkTheme } from './styles/themes';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Welcome, Login, Register, ForgotPassword, Verify } from './pages';
import {Snackbar} from './components';
import './styles/global.css'

const App = () => {
  const { darkMode } = useThemeStore();

  useEffect(() => {
    // Apply the theme attribute whenever the darkMode state changes
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      // Remove the attribute for the default (light) theme
      document.documentElement.removeAttribute('data-theme');
    }
    // Add/remove a class instead if you prefer:
    // document.documentElement.classList.toggle('dark-theme', darkMode);
  }, [darkMode]); // Re-run this effect when darkMode changes
  
  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <Snackbar />
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify" element={<Verify />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;