// src/services/userService.js
import api from './api'; // Uses the configured Axios instance with the interceptor

export const userService = {
  /**
   * Fetches the profile data for the currently authenticated user from the backend.
   */
  fetchUserProfile: async () => {
    try {
      // Interceptor adds token
      const response = await api.get('/user/me');
      if (response.data && response.data.user) {
        return response.data.user;
      } else {
        console.warn('User profile endpoint returned successfully but no user data found.');
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile.');
    }
  },

  /**
   * Uploads a profile picture file TO THE BACKEND.
   * The backend handles uploading to Firebase Storage and updating user records.
   * @param {File} file - The image file to upload.
   * @returns {Promise<object>} A promise that resolves with the updated user profile data (including the new photoURL) from the backend.
   */
  uploadProfilePicture: async (file) => {
    if (!file) {
      throw new Error('File is required for upload.');
    }

    // Use FormData to send the file
    const formData = new FormData();
    // 'profilePicture' MUST match the field name expected by multer on the backend
    formData.append('profilePicture', file);
    console.log("FormData created with file:", file.name, file.type); // Debug log

    try {
      console.log(`Uploading profile picture via backend...`);
      // Make a POST request to the backend endpoint for picture upload
      // The interceptor will add the Authorization token
      // --- MODIFIED: REMOVED the headers option entirely ---
      // Let Axios automatically set the correct Content-Type for FormData
      const response = await api.post('/user/me/picture', formData); // Corrected path based on routes

      // Expect the backend to return the updated user profile
      if (response.data && response.data.user) {
          console.log('Profile picture uploaded and profile updated via backend.');
          return response.data.user; // Return the updated user object
      } else {
          throw new Error('Backend did not return updated user data after picture upload.');
      }

    } catch (error) {
      console.error("Error uploading profile picture via backend:", error.response?.data || error.message);
      // Log the full error response if available
      if (error.response) {
          console.error("Backend Error Response:", error.response);
      }
      throw new Error(error.response?.data?.message || 'Failed to upload profile picture.');
    }
  },


  /**
   * Updates user profile data (excluding picture) in the backend.
   * @param {object} profileData - Object containing fields to update (e.g., name, pronouns, preferredLanguage).
   * @returns {Promise<object>} A promise that resolves with the updated user profile data from the backend.
   */
  updateProfileData: async (profileData) => {
    // Exclude photoURL as it's handled by uploadProfilePicture
    const { photoURL, ...dataToUpdate } = profileData;

    if (!dataToUpdate || Object.keys(dataToUpdate).length === 0) {
      console.log("No non-image profile data provided for update.");
      // Throw error as the intention was likely to update something
      throw new Error('No profile data (excluding picture) provided for update.');
    }

    try {
      // Interceptor adds token
      const response = await api.put('/user/me', dataToUpdate); // Send only allowed fields
      if (response.data && response.data.user) {
        console.log('Profile data updated successfully via backend.');
        return response.data.user; // Return the updated user object from backend
      } else {
         throw new Error('Backend did not return updated user data.');
      }
    } catch (error) {
      console.error('Error updating profile data via backend:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update profile.');
    }
  },

  /**
   * Sends a request to the backend to initiate the password reset flow for the given email.
   * @param {string} email - The user's email address.
   * @returns {Promise<any>} A promise that resolves with the backend response.
   */
   requestPasswordReset: async (email) => {
    if (!email) {
        throw new Error('Email is required to request password reset.');
    }
    try {
      // Call the existing backend endpoint
      const response = await api.post('/auth/forgot-password', { email });
      console.log('Password reset request response:', response);
      return response.data; // Contains { message: '...' } on success
    } catch (error) {
      console.error('Error requesting password reset:', error.response || error);
      throw new Error(error.response?.data?.message || 'Failed to send password reset email.');
    }
  },

};
