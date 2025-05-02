import api from './api'; // Uses the configured Axios instance with the interceptor

export const userService = {
  /**
   * Fetches the profile data for the currently authenticated user.
   * Assumes the backend endpoint is '/users/me' and returns { user: { ... } }
   */
  fetchUserProfile: async () => {
    try {
      // The request interceptor in api.js automatically adds the auth token
      const response = await api.get('/user/me');
      // Assuming the backend returns the user data nested under a 'user' key
      if (response.data && response.data.user) {
        return response.data.user;
      } else {
        // Handle cases where the backend might return 200 OK but no user data
        console.warn('User profile endpoint returned successfully but no user data found.');
        return null; // Or throw an error if user data is strictly expected
      }
    } catch (error) {
      // Log the error for debugging
      console.error('Error fetching user profile:', error.response?.data || error.message);
      // Throw a user-friendly error message
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile.');
    }
  },

};