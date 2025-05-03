import React, { useEffect, useState } from 'react';
import { useThemeStore } from './stores/themeStore';
// --- MODIFIED: Import initializeAuthListener ---
import { useAuthStore, initializeAuthListener } from './stores/authStore'; // Adjust path if needed
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import Page Components (Adjust paths based on your project structure)
import Welcome from './pages/Welcome/Welcome';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import Verify from './pages/Verify/Verify';
import Home from './pages/Home/Home';
import Problems from './pages/Problems/Problems';
// Corrected import name based on previous component creation
import CategoryProblems from './pages/CategoryProblems/CategoryProblems';
import ProfileScreen from './pages/Profile/Profile'; // Corrected import name
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy'; // Corrected import name
import DataDeletion from './pages/DataDeletion/DataDeletion'; // Corrected import name
import ProfileEditScreen from './pages/ProfileEdit/ProfileEdit'; // Corrected import name
import { CodingSession, QuestionList } from './pages'; // Assuming index export

// Import Route Wrapper Components
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'; // Adjust path
import PublicRoute from './components/PublicRoute/PublicRoute'; // Adjust path

// Import Global Components
import { Snackbar } from './components'; // Assuming index export
import BottomNavBar from './components/BottomNavBar/BottomNavBar'; // Adjust path
import Loader from './components/Loader/Loader'; // ** Use your specific Loader import **

// Import Global CSS
import './index.css'; // Or your global css file path
import { useUserStore } from './stores/userStore'; // Import user store

// Layout component to conditionally render BottomNavBar
const Layout = ({ children }) => {
    const location = useLocation();
    // Paths where the bottom nav SHOULD be shown
    const showNavPaths = ['/home', '/me']; // Use /me for profile route
    const showNav = showNavPaths.includes(location.pathname);

    return (
        <>
            {children}
            {/* Conditionally render BottomNavBar based on the specific paths */}
            {showNav && <BottomNavBar />}
        </>
    );
};


const App = () => {
  // Get theme state
  const { darkMode } = useThemeStore();
  // Get auth state directly from store for rendering decisions
  // The listener will update these values
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state=>state.loading)
  // Removed checkAuth and updateProfile from here as they are not directly called in App render
  // const { checkAuth } = useAuthStore();
  // const updateProfile = useUserStore((state) => state.updateProfile);

  // Removed local isCheckingAuth state, rely solely on store's 'loading' state
  // const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // Removed splash screen state for simplicity, can be added back if needed
  // const [showSplash, setShowSplash] = useState(true);
  // const [fadeOut, setFadeOut] = useState(false);

  // Global error listener (keep if needed)
  // window.addEventListener('error', (e) => { ... });

  // Apply data-theme attribute for CSS variable theming
  useEffect(() => {
    const theme = darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [darkMode]);

  // --- MODIFIED: Initialize Auth Listener on mount ---
  useEffect(() => {
    // Initialize the listener that updates the auth store state
    // This function should be defined in authStore.js and handle setting loading states
    const unsubscribe = initializeAuthListener();
    // Clean up the listener when the App component unmounts
    return () => {
        if (unsubscribe && typeof unsubscribe === 'function') { // Check if it's a function before calling
            console.log("Cleaning up auth listener.",authLoading,isAuthenticated);
            unsubscribe();
        } else {
             console.warn("Auth listener unsubscribe function not available or not a function.");
        }
    };
  }, []); // Run only once when App mounts


  // --- MODIFIED: Use authLoading from the store ---
  // This loading state should be initially true in the store and set to false
  // by the initializeAuthListener function once the initial auth state is known.
  if (authLoading) {
      return <Loader message="Initializing Session..." />; // Use your Loader component
  }

  return (
    <>
      {/* Removed ErrorBoundary for simplicity, add back if needed */}
      <Snackbar />
      <Router>
        <Layout>
            <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/data-deletion" element={<DataDeletion />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/home" element={<Home />} />
                <Route path="/problems" element={<Problems />} />
                {/* Corrected component name */}
                <Route path="/category/:categoryId" element={<CategoryProblems />} />
                {/* Corrected path and component name */}
                <Route path="/:categoryId/solve/:questionId" element={<CodingSession />} />
                <Route path="/me" element={<ProfileScreen />} /> {/* Use ProfileScreen */}
                <Route path="/me/edit" element={<ProfileEditScreen />} /> {/* Use ProfileEditScreen */}
                {/* Removed /random route unless needed */}
                {/* <Route path="/random" element={<div>Random Page Placeholder</div>} /> */}
                 {/* <Route path="/questions" element={<QuestionList />} /> */}
            </Route>

            {/* Catch-all Route */}
            <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />

            </Routes>
        </Layout>
      </Router>
    </>
  );
};

export default App;
