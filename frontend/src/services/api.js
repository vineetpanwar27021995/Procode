// src/services/api.js
import axios from 'axios';
// Import auth service if needed for logout, or handle logout directly
import { authService } from './auth'; // Adjust path as needed

// Use environment variable for base URL or fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor to add token from localStorage
api.interceptors.request.use(
    (config) => {
        // Retrieve the token stored after backend login
        const token = localStorage.getItem('token'); // Or wherever you store the backend token

        // If a token exists, add it to the Authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            // console.log('Interceptor: Attaching token from localStorage.'); // For debugging
        } else {
            // console.log('Interceptor: No token found in localStorage.'); // For debugging
            // Request proceeds without Authorization header
        }
        return config; // Continue with the config
    },
    (error) => {
        // Handle request configuration error
        console.error('Axios request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response Interceptor to handle Auth errors (like 401/403)
api.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error(`Auth Error (${error.response.status}):`, error.response.data?.message || error.response.data?.error || 'Unauthorized/Forbidden');

            localStorage.removeItem('token');

            if (window.location.pathname !== '/login') {
                 window.location.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
