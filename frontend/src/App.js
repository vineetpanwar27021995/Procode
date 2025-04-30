import React, { useEffect, useState } from 'react';
import { useThemeStore } from './stores/themeStore';
import { lightTheme, darkTheme } from './styles/themes';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Welcome, Login, ForgotPassword, Verify, QuestionList, CodingSession } from 'react-router-dom';
import { Welcome, Login, Register, ForgotPassword, Verify } from './pages';
import {Snackbar} from './components';
import './global.css';
import { Snackbar, SplashScreen } from './components';
import './styles/global.css'
import useAnamSessionToken from './hooks/useAnamSessionToken';
import { ErrorBoundary } from "react-error-boundary";

const App = () => {
  const { darkMode } = useThemeStore();
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  window.addEventListener('error', (e) => {
    if (
      e.message === 'ResizeObserver loop completed with undelivered notifications.'
    ) {
      e.stopImmediatePropagation();
    }
  });

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

  const { ensureSessionToken } = useAnamSessionToken();
  useEffect(() => {
    ensureSessionToken(); // Only fetches if not already present
  }, [ensureSessionToken]);


  useEffect(() => {
    // Fade out before removing splash
    const timer1 = setTimeout(() => setFadeOut(true), 1000); // start fade after 1s
    const timer2 = setTimeout(() => setShowSplash(false), 2000); // fully hide after fade

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (showSplash) {
    return (
      <div
        className={`transition-opacity duration-500 ease-in-out ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <SplashScreen />
      </div>
    );
  }
  
  return (
      <ErrorBoundary fallback={<div>Something went wrong! Please try again later</div>}>
        <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
          <Snackbar />
          <Router>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/questions" element={<QuestionList />} />
              <Route path="/solve/:questionId" element={<CodingSession />} />
            </Routes>
          </Router>
          </ThemeProvider>
      </ErrorBoundary>
  );
};

export default App;