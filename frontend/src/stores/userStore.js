// src/stores/userStore.js
import { create } from 'zustand';
import { userService } from '../services/user'; // Adjust path as needed

export const useUserStore = create((set) => ({
  // State for the detailed user profile fetched from the DB
  userProfile: null,
  loading: false,
  error: null,

  // Action to fetch the user profile
  fetchUserProfile: async () => {
    // Check if already loading to prevent multiple simultaneous fetches
    if (useUserStore.getState().loading) return;

    set({ loading: true, error: null });
    try {
      // Call the service function
      const profileData = await userService.fetchUserProfile();
      set({
        userProfile: profileData, // Store the fetched profile data
        loading: false
      });
      return profileData; // Return data for potential chaining or direct use
    } catch (error) {
      console.error("Error in user store fetchUserProfile:", error);
      set({
        error: error.message || 'Failed to fetch user profile',
        loading: false,
        userProfile: null // Clear profile on error
      });
      // Optionally re-throw if components need to handle the error directly
      // throw error;
      return null; // Indicate failure
    }
  },

  // Action to clear user profile data (e.g., on logout)
  clearUserProfile: () => {
    set({ userProfile: null, error: null, loading: false });
  },

  // You might potentially merge userProfile state management with useAuthStore
  // depending on whether you want separate profile data fetching or have it
  // tightly coupled with the auth user object. This example keeps it separate.

}));
