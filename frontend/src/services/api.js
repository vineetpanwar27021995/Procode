// src/services/api.js
import axios from 'axios';
// Import your Firebase auth instance or a function to get the token
// Option 1: Direct Firebase import (if configured client-side)
// import { auth } from '../config/firebase'; // Adjust path if needed

// Option 2: Using your auth service (Recommended)
import { authService } from './auth'; // Adjust path

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8082/api'
});

// --- Add Request Interceptor ---
api.interceptors.request.use(
  async (config) => {
    // Check if the request requires authentication (you might have specific paths)
    // For simplicity, we'll try to add it to most requests to your API base URL
    // You could add more specific checks based on config.url if needed

    let idToken = null;
    try {
      // --- Get the ID token ---
      // Option 1: Using direct firebase auth instance
      // const currentUser = auth.currentUser;
      // if (currentUser) {
      //   idToken = await currentUser.getIdToken();
      // }

      // Option 2: Using your authService (preferred if it handles token logic)
      // This assumes authService has a method like getCurrentUserToken()
      // or that getCurrentUser() returns an object with getIdToken method
      const user = await authService.getCurrentUser(); // Or however you get the user/token state
      if (user && typeof user.getIdToken === 'function') { // Check if it's a Firebase user object
         idToken = await user.getIdToken();
      } else {
         // Fallback: Maybe the token is stored elsewhere (e.g., localStorage after login)
         idToken = localStorage.getItem('firebaseIdToken'); // Example, adjust if you store it
      }

    } catch (error) {
      console.error('Error getting Firebase ID token:', error);
      // Handle error appropriately, maybe redirect to login
    }

    // If a token exists, add it to the Authorization header
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
      // console.log('Attaching token:', idToken); // For debugging
    } else {
       // console.log('No token found for request'); // For debugging
    }

    return config; // Continue with the modified config
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Optional: Add Response Interceptor for handling 401/403 errors globally
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Handle unauthorized errors, e.g., redirect to login
      console.error('Unauthorized or Forbidden request:', error.response.data);
      // Example: useAuthStore.getState().logout(); // Logout user
      // window.location.href = '/login'; // Redirect
    }
    return Promise.reject(error); // Pass error along
  }
);


export default api;