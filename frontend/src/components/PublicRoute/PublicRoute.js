import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore'; // Adjust path as needed

/**
 * A component for public routes (like login, register).
 * Redirects to /home if the user is already authenticated.
 * Renders the child route using <Outlet /> if not authenticated.
 */
const PublicRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading); // Get loading state

  // Optional: Show loading indicator while initial auth check is running
  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  // If finished loading and IS authenticated, redirect away from public route
  // if (isAuthenticated) {
  //   return <Navigate to="/home" replace />; // Redirect to home or dashboard
  // }

  // If not authenticated, render the public route element
  return <Outlet />;
};

export default PublicRoute;
