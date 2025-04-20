import React from 'react';
import { useThemeStore } from './stores/themeStore';
import { lightTheme, darkTheme } from './styles/themes';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Welcome, Login, Register, ForgotPassword, Verify } from './pages';
import {Snackbar} from './components';
import './styles/global.css'

const App = () => {
  const { darkMode } = useThemeStore();
  
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