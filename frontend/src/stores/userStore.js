// src/stores/userStore.js
import { create } from 'zustand';
import { userService } from '../services/user'; // Adjust path as needed
import { useAuthStore } from './authStore'; // Import auth store for user email/UID fallback

export const useUserStore = create((set, get) => ({ // Add get to access state within actions
  // State for the detailed user profile fetched from the DB
  userProfile: null,
  loading: false, // General loading for fetch/update profile data
  loadingImage: false, // Specific loading state for image upload
  error: null,

  // Action to fetch the user profile
  fetchUserProfile: async () => {
    if (get().loading) return; // Prevent multiple fetches

    set({ loading: true, error: null });
    try {
      const profileData = await userService.fetchUserProfile();
      set({
        userProfile: profileData,
        loading: false
      });
      return profileData;
    } catch (error) {
      console.error("Error in user store fetchUserProfile:", error);
      set({
        error: error.message || 'Failed to fetch user profile',
        loading: false,
        userProfile: null
      });
      return null;
    }
  },

  // Action to update profile data (name, pronouns, language)
  updateProfile: async (updateData) => {
     if (get().loading) return; // Prevent multiple updates
     set({ loading: true, error: null });
     try {
         // Call service to update data via backend (updates Firestore & Auth name)
         const updatedUserProfile = await userService.updateProfileData(updateData);
         set({
             userProfile: updatedUserProfile, // Update local state with response from backend
             loading: false
         });
         console.log("User profile updated in store.");
         return { success: true, user: updatedUserProfile };
     } catch (error) {
         console.error("Error in user store updateProfile:", error);
         set({
             error: error.message || 'Failed to update profile',
             loading: false
             // Keep existing profile data on error? Or clear? Decide based on UX.
         });
         return { success: false, error: error.message };
     }
  },

  // --- MODIFIED: Action to upload profile picture via backend ---
  uploadAndUpdateProfilePicture: async (file) => {
      // No UID needed here as backend gets it from token
      if (!file) {
          const errorMsg = "No file selected for upload.";
           console.error(errorMsg);
          set({ error: errorMsg });
          return { success: false, error: errorMsg };
      }

      set({ loadingImage: true, error: null }); // Start image loading indicator
      try {
          // 1. Call service to upload image via backend
          // This service function now expects the updated user profile in return
          const updatedUserProfile = await userService.uploadProfilePicture(file);

          // 2. Update local state with the profile returned from backend
          set({
              userProfile: updatedUserProfile,
              loadingImage: false
          });
          console.log("Profile picture uploaded and profile updated via backend.");
          return { success: true, photoURL: updatedUserProfile?.photoURL }; // Return new URL

      } catch (error) {
          console.error("Error in user store uploadAndUpdateProfilePicture:", error);
          set({
              error: error.message || 'Failed to upload profile picture',
              loadingImage: false
          });
          return { success: false, error: error.message };
      }
  },

   // Action to request password reset
   requestPasswordResetEmail: async () => {
       const currentProfile = get().userProfile;
       // Get email from profile or auth store
       const email = currentProfile?.email || useAuthStore.getState().user?.email;

       if (!email) {
           const errorMsg = "Cannot request password reset: Email not found.";
           console.error(errorMsg);
           set({ error: errorMsg }); // Set error in user store? Or handle differently?
           return { success: false, error: errorMsg };
       }

       set({ error: null }); // Clear previous errors
       try {
           await userService.requestPasswordReset(email);
           console.log("Password reset email request sent.");
           return { success: true };
       } catch (error) {
            console.error("Error in user store requestPasswordResetEmail:", error);
            set({ error: error.message || 'Failed to send password reset email' });
            return { success: false, error: error.message };
       }
   },


  // Action to clear user profile data (e.g., on logout)
  clearUserProfile: () => {
    set({ userProfile: null, error: null, loading: false, loadingImage: false });
  },

}));
