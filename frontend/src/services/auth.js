import api from './api';
import { jwtDecode } from "jwt-decode";

export const authService = {
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      console.log('response',response)
      return response.data;
    } catch (error) {     
      console.log('error',error)
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  verifyCode: async (code, email) => {
    try {
      const response = await api.post('/auth/verify-email', { otp:code, email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid verification code. Please try again.');
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resend verification code. Please try again.');
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('respose',response)
      if (response.data.token) {
        localStorage.setItem('token', response.data.idToken);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid email or password. Please try again.');
    }
  },

  forgotPassword: async (email) => {
    try {
      // Assuming a backend endpoint exists for initiating password reset
      const response = await api.post('/auth/forgot-password', { email });
      console.log('Forgot password response:', response);
      // Return data if backend sends confirmation or specific instructions
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Failed to initiate password reset. Please try again.');
    }
  },

  logout: () => {
    try {
      // Primary action is to remove the token used by the interceptor
      localStorage.removeItem('token');
      console.log('Token removed from localStorage (logout).');
      // No backend call needed unless you have server-side sessions to invalidate
      // If you need to invalidate a server session, add: await api.post('/auth/logout');
    } catch (error) {
        // This part usually won't fail, but good practice
        console.error('Error during logout (clearing token):', error);
    }
  },

  // --- MODIFIED getCurrentUser ---
  getCurrentUser: async () => {
    // This function attempts to decode the token stored in localStorage
    // and return user data if the token is valid and not expired.
    const token = localStorage.getItem('token');
    if (!token) {
        // console.log('getCurrentUser: No token found in localStorage.');
        return null; // No token means not authenticated
    }

    try {
        // Decode the token locally
        const decodedToken = jwtDecode(token);
        // console.log('Decoded Token:', decodedToken); // For debugging

        // Check if the token has an expiration claim (exp)
        if (decodedToken.exp) {
            // Check if expired (exp is in seconds, Date.now() is in milliseconds)
            const isExpired = decodedToken.exp * 1000 < Date.now();
            if (isExpired) {
                console.log('getCurrentUser: Token expired.');
                localStorage.removeItem('token'); // Remove expired token
                return null;
            }
        } else {
            // Handle tokens without an expiration claim if necessary
            console.warn('getCurrentUser: Token does not have an expiration claim.');
            // Depending on your security policy, you might want to reject such tokens
            // localStorage.removeItem('token');
            // return null;
        }

        // If token is valid and not expired, construct user object from claims
        // Adjust property names based on your actual token payload
        const user = {
            uid: decodedToken.user_id || decodedToken.sub, // Use user_id or sub (subject) for UID
            email: decodedToken.email,
            name: decodedToken.name, // Or displayName
            emailVerified: decodedToken.email_verified,
            photoUrl: decodedToken.picture
            // Add any other relevant claims you need
        };

        console.log('getCurrentUser: Token decoded and valid.',decodedToken,user);
        return user;

    } catch (error) {
        // Catch errors during decoding (e.g., invalid token format)
        console.error('getCurrentUser: Error decoding token:', error.message);
        localStorage.removeItem('token'); // Remove invalid token
        return null; // Assume not authenticated if decoding fails
    }
  }
};