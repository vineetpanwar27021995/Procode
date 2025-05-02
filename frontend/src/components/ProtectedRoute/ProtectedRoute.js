import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore'; // Adjust path as needed

/**
 * A component to protect routes that require authentication.
 * Redirects to /login if the user is not authenticated.
 * Renders the child route using <Outlet /> if authenticated.
 */
const ProtectedRoute = () => {
  // Get authentication status from the store
  // isAuthenticated should be true only after checkAuth confirms a valid session/user
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading); // Get loading state
  const user = useAuthStore((state) => state.user); // Get loading state

  // Optional: Show loading indicator while initial auth check is in progress
  // This prevents redirecting before the check completes on app load.
  // Note: This assumes 'loading' is true during the initial checkAuth call.
  // if (loading) {
  //    // You can return a loading spinner component here
  //    return <div>Loading...</div>;
  // }
  // console.log('protected',user,isAuthenticated)

  // If finished loading and not authenticated, redirect to login
  if (!isAuthenticated) {
    // You can pass the intended destination via state if needed
    // return <Navigate to="/login" state={{ from: location }} replace />;
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child route element
  return <Outlet />;
};

export default ProtectedRoute;
