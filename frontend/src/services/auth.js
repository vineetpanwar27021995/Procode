import api from './api';

export const authService = {
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  verifyCode: async (code) => {
    try {
      const response = await api.post('/auth/verify', { code });
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
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid email or password. Please try again.');
    }
  }
};