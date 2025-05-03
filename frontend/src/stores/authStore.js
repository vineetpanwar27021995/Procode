// src/stores/authStore.js
import { create } from 'zustand';
import { authService } from '../services/auth'; // Keep for auth actions
import { userService } from '../services/user'; // Adjust path if needed
import { auth } from '../config/firebase'; // Import client auth instance
import { onAuthStateChanged } from "firebase/auth"; // Import listener

// --- Helper: Listen to Firebase Auth state changes ---
let authListenerUnsubscribe = null;

export const initializeAuthListener = () => {
  if (authListenerUnsubscribe) {
    console.log("Auth listener already initialized.");
    return authListenerUnsubscribe;
  }
  console.log("Initializing Firebase Auth state listener...");

  // --- REMOVED external setState reference ---
  // const setState = useAuthStore.setState;

  // Set initial loading state using the store's method directly
  // This ensures it happens before the async listener might fire
  useAuthStore.setState({ loading: true });
  console.log("Initial auth store state set to loading: true");

  try {
      // Wrap the async callback in a timeout to ensure Firebase is ready
      // This is a common workaround for initial load timing issues.
      setTimeout(() => { // Optional: Delay listener attachment slightly

          authListenerUnsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed callback initiated. User:", user?.email || 'None');

            try {
                if (user) {
                    if (user.emailVerified) {
                        console.log("User authenticated and email verified. Fetching backend profile...");
                        try {
                            const profileResponse = await userService.fetchUserProfile();
                            if (profileResponse) {
                                useAuthStore.setState({ user: profileResponse, isAuthenticated: true, loading: false, error: null });
                                console.log("State Updated: Backend profile fetched.");
                            } else {
                                console.warn("User authenticated but profile not found in backend DB.");
                                useAuthStore.setState({
                                    user: { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL, emailVerified: user.emailVerified },
                                    isAuthenticated: true, loading: false, error: "User profile data missing."
                                });
                                console.log("State Updated: Profile missing, using basic info.");
                            }
                        } catch (error) {
                            console.error("Error fetching backend profile after auth change:", error);
                            useAuthStore.setState({ user: null, isAuthenticated: false, loading: false, error: "Failed to load user profile." });
                            console.log("State Updated: Profile fetch error.");
                        }
                    } else {
                        console.warn("User authenticated but email not verified.");
                        useAuthStore.setState({
                            user: { uid: user.uid, email: user.email, name: user.displayName, photoURL: user.photoURL, emailVerified: false },
                            isAuthenticated: false, loading: false, error: "Email not verified."
                        });
                        console.log("State Updated: Email not verified.");
                    }
                } else {
                    console.log("User signed out.");
                    useAuthStore.setState({ user: null, isAuthenticated: false, loading: false, error: null });
                    console.log("State Updated: User signed out.");
                }
            } catch (listenerError) {
                 console.error("Unexpected error within onAuthStateChanged listener:", listenerError);
                 useAuthStore.setState({ user: null, isAuthenticated: false, loading: false, error: "Authentication check failed." });
                 console.log("State Updated: Listener error.");
            }
          });
          console.log("onAuthStateChanged listener attached successfully.");

      }, 100); // Optional: Delay milliseconds

  } catch (initError) {
       console.error("Error attaching onAuthStateChanged listener:", initError);
       // If listener fails to attach, set loading to false immediately
       useAuthStore.setState({ loading: false, error: "Failed to initialize auth listener." });
  }

  return authListenerUnsubscribe;
};
// --- End Auth Listener ---


export const useAuthStore = create((set) => ({
    user: null,
    loading: true, // Start as true
    error: null,
    isAuthenticated: false,

    // Register action
    register: async (name, email, password) => {
        set({ error: null });
        try {
            const response = await authService.register(name, email, password);
            // set({ loading: false });
            return response;
        } catch (error) {
            set({ error: error.message || 'Registration failed', loading: false });
            throw error;
        }
    },

    // VerifyCode action
    verifyCode: async (code, email) => {
        set({ error: null });
        try {
            const response = await authService.verifyCode(code, email);
            // Let listener handle state update after refresh
            await auth.currentUser?.getIdToken(true);
            // Set loading false here as listener might take time after token refresh
            // set({ loading: false });
            return response;
        } catch (error) {
            set({ error: error.message || 'Verification failed', loading: false });
            throw error;
        }
    },

    // ResendVerification action
    resendVerification: async (email) => {
        set({ error: null });
        try {
            const response = await authService.resendVerification(email);
            return response;
        } catch (error) {
             set({ error: error.message || 'Failed to resend verification' });
            throw error;
        }
    },

    // Login action
    login: async (email, password) => {
        set({ loading: true, error: null });
        try {
            const backendUser = await authService.login(email, password);
            // Listener will handle setting the final state
            // set({ loading: false }); // Let listener handle this
            return backendUser;
        } catch (error) {
            set({ error: error.message || 'Login failed', loading: false, user: null, isAuthenticated: false });
            throw error;
        }
    },

     // Social Login Actions
    loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
            const backendUser = await authService.signInWithGoogle();
            // Let listener handle final state
            // set({ loading: false });
            return backendUser;
        } catch (error) {
            set({ error: error.message || 'Google Sign-In failed.', loading: false, user: null, isAuthenticated: false });
            throw error;
        }
    },

    loginWithFacebook: async () => {
        set({ loading: true, error: null });
        try {
            const backendUser = await authService.signInWithFacebook();
            // Let listener handle final state
            // set({ loading: false });
            return backendUser;
        } catch (error) {
            set({ error: error.message || 'Facebook Sign-In failed.', loading: false, user: null, isAuthenticated: false });
            throw error;
        }
    },

    // ForgotPassword action
    forgotPassword: async (email) => {
        set({ loading: false, error: null });
        try {
            const response = await authService.forgotPassword(email);
            return response;
        } catch (error) {
            set({ error: error.message || 'Password reset failed', loading: false });
            throw error;
        }
    },

    // Logout action
    logout: async () => {
        await authService.logout();
        // Listener will set state, but clear immediately too
        set({ user: null, isAuthenticated: false, error: null, loading: false });
    },

}));
