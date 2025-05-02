import React, { useEffect, useState } from 'react';
import { useThemeStore } from './stores/themeStore'; // Adjust path if needed
import { useAuthStore } from './stores/authStore'; // Adjust path if needed

// Import Page Components (Adjust paths based on your project structure)
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Verify from './pages/Verify/Verify';
import Home from './pages/Home/Home'; // Create this component if it doesn't exist
import Problems from './pages/Problems/Problems'; 

import './index.css';
import CategoryProblems from 'pages/CategoryProblems/CategoryProblems';
import Profile from 'pages/Profile/Profile';
import ProfileEdit from 'pages/ProfileEdit/ProfileEdit';
import { lightTheme, darkTheme } from './styles/themes';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Snackbar, SplashScreen, ProtectedRoute,PublicRoute } from './components';
import useAnamSessionToken from './hooks/useAnamSessionToken';
import { ErrorBoundary } from "react-error-boundary";
import { CodingSession, QuestionList } from 'pages';
import BottomNavBar from 'components/BottomNavBar/BottomNavBar';
import Loader from 'components/Loader/Loader';
import { useUserStore } from 'stores/userStore';

const App = () => {
  // Get theme state
  const { darkMode } = useThemeStore();
  // Get auth state and checkAuth action
  const { checkAuth, loading: authLoading, isAuthenticated } = useAuthStore();
  const updateProfile = useUserStore((state) => state.updateProfile);

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
        const user = await checkAuth();
        updateProfile(user);

        console.log("App Mount: Auth check complete.",user); // Debug log
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

  // useEffect(() => {
  //   // Fade out before removing splash
  //   const timer1 = setTimeout(() => setFadeOut(true), 1000); // start fade after 1s
  //   const timer2 = setTimeout(() => setShowSplash(false), 1500); // fully hide after fade

  //   return () => {
  //     clearTimeout(timer1);
  //     clearTimeout(timer2);
  //   };
  // }, []);

  // if (showSplash) {
  //   return (
  //     <div
  //       className={`transition-opacity duration-500 ease-in-out ${
  //         fadeOut ? 'opacity-0' : 'opacity-100'
  //       }`}
  //     >
  //       <SplashScreen />
  //     </div>
  //   );
  // }

  if (isCheckingAuth) {
    return (
        <Loader message="Initializing..." />
    );
}

const Layout = ({ children }) => {
  const location = useLocation();
  // Define paths where the bottom nav SHOULD be shown
  const showNavPaths = ['/home', '/me']; // Only show on these exact paths
  // Check if the current pathname is exactly one of the allowed paths
  const showNav = showNavPaths.includes(location.pathname);

  return (
      <>
          {children}
          {/* Conditionally render BottomNavBar based on the specific paths */}
          {showNav && <BottomNavBar />}
      </>
  );
};

  return (
    <>
      <ErrorBoundary fallback={<div>Something went wrong! Please try again later</div>}>
      <Snackbar />
      <Router>
        <Layout>
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

          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/category/:categoryId" element={<CategoryProblems />} />
            <Route path="/me" element={<Profile />} />
            <Route path="/me/edit" element={<ProfileEdit />} />
            <Route path="/:categoryId/solve/:questionId" element={<CodingSession />} />
            <Route path="/questions" element={<QuestionList />} />
          </Route>

          {/* Catch-all Route: Redirects unknown paths */}
          {/* Redirect to /home if logged in, otherwise redirect to /login */}
          {/* Note: This might conflict if Welcome page ('/') should be accessible when logged in */}
          {/* Consider removing this or adjusting logic if '/' needs different handling */}
          {/* <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} /> */}

        </Routes>
        </Layout>
      </Router>

      </ErrorBoundary>
    </>
  );
};

export default App;
