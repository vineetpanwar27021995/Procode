import React, { useEffect, useState } from 'react';
import { useThemeStore } from './stores/themeStore'; // Adjust path if needed
import { useAuthStore } from './stores/authStore'; // Adjust path if needed
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Page Components (Adjust paths based on your project structure)
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Verify from './pages/Verify/Verify';
import Home from './pages/Home/Home'; // Create this component if it doesn't exist
import Problems from './pages/Problems/Problems'; 
import { Snackbar,ProtectedRoute,PublicRoute } from './components';

import './index.css';
import CategoryProblems from 'pages/CategoryProblems/CategoryProblems';
import Profile from 'pages/Profile/Profile';
import ProfileEdit from 'pages/ProfileEdit/ProfileEdit';
import { useThemeStore } from './stores/themeStore';
import { lightTheme, darkTheme } from './styles/themes';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Register, Welcome, Login, ForgotPassword, Verify, QuestionList, CodingSession } from './pages';
import './global.css';
import { Snackbar, SplashScreen } from './components';
import './styles/global.css'
import useAnamSessionToken from './hooks/useAnamSessionToken';
import { ErrorBoundary } from "react-error-boundary";

const App = () => {
  // Get theme state
  const { darkMode } = useThemeStore();
  // Get auth state and checkAuth action
  const { checkAuth, loading: authLoading, isAuthenticated } = useAuthStore();
  // Local loading state specifically for the initial auth check on app load
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  window.addEventListener('error', (e) => {
    if (
      e.message === 'ResizeObserver loop completed with undelivered notifications.'
    ) {
      e.stopImmediatePropagation();
    }
  });

  // Apply data-theme attribute for CSS variable theming
  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [darkMode]);

  // Check authentication status when the app loads
  useEffect(() => {
    const verifyAuth = async () => {
      console.log("App Mount: Checking authentication..."); // Debug log
      setIsCheckingAuth(true); // Ensure loading state is true during check
      try {
        // Call the checkAuth action from the store.
        // This should use authService.getCurrentUser() which checks localStorage token.
        await checkAuth();
        console.log("App Mount: Auth check complete."); // Debug log
      } catch (err) {
        console.error("App Mount: Error during initial auth check:", err);
        // Error state should be handled within the store's checkAuth function
      } finally {
         setIsCheckingAuth(false); // Mark initial check as complete regardless of outcome
         console.log("App Mount: Initial auth check finished."); // Debug log
      }
    };
    verifyAuth();
  }, [checkAuth]); 
  if (isCheckingAuth) {
      return (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
              Loading Application...
          </div>
      );
  }

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
    <>
      <ErrorBoundary fallback={<div>Something went wrong! Please try again later</div>}>
      <Snackbar />
      <Router>
        <Routes>
          {/* Public Routes: Accessible only when logged OUT */}
          {/* PublicRoute checks if authenticated and redirects to /home if true */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify" element={<Verify />} />
          </Route>

          {/* Protected Routes: Accessible only when logged IN */}
          {/* ProtectedRoute checks if authenticated and redirects to /login if false */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/category/:categoryId" element={<CategoryProblems />} />
            <Route path="/me" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            {/* Add other protected routes here */}
            {/* Example: <Route path="/profile" element={<Profile />} /> */}
          </Route>

          {/* Catch-all Route: Redirects unknown paths */}
          {/* Redirect to /home if logged in, otherwise redirect to /login */}
          {/* Note: This might conflict if Welcome page ('/') should be accessible when logged in */}
          {/* Consider removing this or adjusting logic if '/' needs different handling */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />

        </Routes>
      </Router>
      </ErrorBoundary>
    </>
  );
};

export default App;
