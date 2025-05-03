// src/services/auth.js
import api from './api'; // Your configured Axios instance
// Import Firebase client SDK functions and the initialized auth instance
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider, // Import Google provider
    FacebookAuthProvider, // Import Facebook provider
    signInWithPopup, // Import signInWithPopup
    sendEmailVerification, // For sending verification email on signup
    updateProfile // For updating display name after signup
} from "firebase/auth";
import { auth } from '../config/firebase'; // Import the initialized client auth instance

// Create provider instances
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
// Optional: Add custom OAuth scopes if needed
// googleProvider.addScope('profile');
// googleProvider.addScope('email');

export const authService = {
  // Register still calls backend first to create user & send custom OTP
  // (Keep this if your backend handles custom OTP verification)
  register: async (name, email, password) => {
    try {
      // 1. Call backend to create user in Auth/DB and send OTP
      const backendResponse = await api.post('/auth/register', { name, email, password });
      console.log('Backend registration response:', backendResponse);

      // 2. Optionally send Firebase's built-in verification email *after* backend success
      // This is redundant if your backend OTP flow works, but useful as fallback or primary method
      // try {
      //    // Need to sign the user in briefly to get the user object, or handle differently
      //    const tempUserCredential = await signInWithEmailAndPassword(auth, email, password);
      //    if (tempUserCredential.user && !tempUserCredential.user.emailVerified) {
      //        await sendEmailVerification(tempUserCredential.user);
      //        console.log("Firebase verification email sent.");
      //    }
      //    await signOut(auth); // Sign out the temporary user
      // } catch (fbVerifyError) {
      //     console.error("Error sending Firebase verification email:", fbVerifyError);
      // }

      return backendResponse.data; // Return backend response
    } catch (error) {
      console.error('Registration error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  },

  // Verify code still calls your backend (assuming custom OTP)
  verifyCode: async (code, email) => {
    try {
      const response = await api.post('/auth/verify-email', { otp: code, email });
      console.log('Verification response:', response);
      // After successful backend verification, the backend should mark emailVerified=true
      // The client SDK's auth state listener will eventually pick this up.
      // You might want to force-refresh the token here: await auth.currentUser?.getIdToken(true);
      return response.data;
    } catch (error) {
      console.error('Verification error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Invalid verification code. Please try again.');
    }
  },

  // Resend verification still calls your backend (assuming custom OTP)
  resendVerification: async (email) => {
    try {
      const response = await api.post('/auth/resend-verification', { email });
      console.log('Resend verification response:', response);
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error.response || error);
      throw new Error(error.response?.data?.message || 'Failed to resend verification code. Please try again.');
    }
  },

  // --- MODIFIED: Login uses Firebase Client SDK ---
  login: async (email, password) => {
    try {
      // 1. Sign in using Firebase Client SDK
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("Firebase client login successful for:", firebaseUser.email);

      // 2. Check if email is verified (important!)
      if (!firebaseUser.emailVerified) {
          console.warn("Login attempt failed: Email not verified.");
          await signOut(auth); // Sign out user if email is not verified
          throw new Error('Email not verified. Please check your inbox or resend the verification code.');
      }

      // 3. Get ID token to potentially send to backend or just rely on interceptor
      // const idToken = await firebaseUser.getIdToken();
      // localStorage.setItem('token', idToken); // Store token if needed immediately (interceptor will handle future ones)

      // 4. Optionally fetch full profile from *your* backend after successful Firebase login
      // This ensures you get Firestore data merged with Auth data
      try {
          const profileResponse = await api.get('/auth/me'); // Interceptor adds token
          console.log("Fetched backend profile after login:", profileResponse.data.user);
          return profileResponse.data.user; // Return merged user data from backend
      } catch (profileError) {
           console.error("Login successful, but failed to fetch backend profile:", profileError);
           // Return basic Firebase user info as fallback
           return {
               uid: firebaseUser.uid,
               email: firebaseUser.email,
               name: firebaseUser.displayName,
               photoURL: firebaseUser.photoURL,
               emailVerified: firebaseUser.emailVerified,
               // Indicate profile fetch failed?
           };
      }

    } catch (error) {
      console.error("Firebase login error:", error.code, error.message);
      localStorage.removeItem('token'); // Clear any potentially stale token
      throw new Error(mapFirebaseAuthError(error.code) || 'Login failed. Please check credentials.');
    }
  },

  // --- NEW: Sign in with Google ---
  signInWithGoogle: async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // The signed-in user info.
      const user = result.user;
      console.log("Google Sign-In successful:", user);
      // Get ID token to send to backend for user creation/lookup in Firestore
      const idToken = await user.getIdToken();

      // Call backend to ensure user exists in Firestore and get full profile
      const backendResponse = await api.post('/auth/google/login', { token: idToken });

      if (backendResponse.data && backendResponse.data.user) {
          // Store token if backend sends one back (though usually not needed with client SDK managing session)
          // if(backendResponse.data.idToken) localStorage.setItem('token', backendResponse.data.idToken);
          return backendResponse.data.user; // Return user data from backend
      } else {
           throw new Error("Backend verification failed after Google Sign-In.");
      }
    } catch (error) {
      console.error("Google Sign-In Error:", error.code, error.message);
      // Handle specific errors like popup closed, account exists with different credential, etc.
      throw new Error(error.message || 'Google Sign-In failed.');
    }
  },

  // --- NEW: Sign in with Facebook ---
  signInWithFacebook: async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const user = result.user;
      console.log("Facebook Sign-In successful:", user);
      const idToken = await user.getIdToken();

      // Call backend to ensure user exists in Firestore and get full profile
      const backendResponse = await api.post('/auth/facebook/login', { token: idToken });

       if (backendResponse.data && backendResponse.data.user) {
          // if(backendResponse.data.idToken) localStorage.setItem('token', backendResponse.data.idToken);
          return backendResponse.data.user; // Return user data from backend
      } else {
           throw new Error("Backend verification failed after Facebook Sign-In.");
      }
    } catch (error) {
      console.error("Facebook Sign-In Error:", error.code, error.message);
      // Handle specific errors
      throw new Error(error.message || 'Facebook Sign-In failed.');
    }
  },


  // --- MODIFIED: Use Firebase Client SDK for password reset email ---
  forgotPassword: async (email) => {
    try {
      // Use client SDK to send the email directly
      await sendPasswordResetEmail(auth, email, {
          // URL to redirect back to after reset (must be authorized in Firebase console)
          url: process.env.REACT_APP_PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3000/login',
      });
      console.log('Firebase password reset email sent.');
      // No backend call needed here unless you want to log the request
      return { message: 'Password reset email sent successfully.' }; // Return success message
    } catch (error) {
      console.error('Firebase forgot password error:', error.code, error.message);
      throw new Error(mapFirebaseAuthError(error.code) || 'Failed to send password reset email.');
    }
  },

  // --- MODIFIED: Logout uses Firebase Client SDK ---
  logout: async () => { // Make async if needed elsewhere
    try {
      await signOut(auth); // Use client SDK signOut
      localStorage.removeItem('token'); // Clear any manually stored token
      console.log('User signed out from Firebase.');
    } catch (error) {
      console.error("Error signing out from Firebase:", error);
      // Still attempt to clear local storage
      localStorage.removeItem('token');
    }
  },

  // --- MODIFIED: getCurrentUser uses Firebase Client SDK ---
  getCurrentUser: () => {
    // This function now relies on the Firebase SDK's internal state management.
    // The recommended way is to use onAuthStateChanged listener in your App/root component.
    // This service function can simply return the current synchronous value.
    // The Zustand store's checkAuth action might need adjustment.
    return auth.currentUser; // Return the currently signed-in user object (or null)
  },

   // --- NEW: Get ID Token (Helper for Interceptor) ---
   getCurrentUserToken: async () => {
       if (auth.currentUser) {
           try {
               // Pass true to force refresh the token if it's expired
               const idToken = await auth.currentUser.getIdToken(true);
               return idToken;
           } catch (error) {
                console.error("Error refreshing ID token:", error);
                // Handle error, maybe sign out user
                await authService.logout(); // Sign out if token cannot be refreshed
                return null;
           }
       }
       return null; // No user logged in
   }

};

// Helper function to map Firebase error codes to user-friendly messages
function mapFirebaseAuthError(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email': return 'Invalid email address format.';
    case 'auth/user-disabled': return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case "auth/invalid-credential": return 'Invalid email or password.';
    case 'auth/email-already-in-use': return 'This email is already registered.';
    case 'auth/weak-password': return 'Password is too weak (should be at least 6 characters).';
    case 'auth/requires-recent-login': return 'This action requires re-authentication. Please log in again.';
    case 'auth/popup-closed-by-user': return 'Sign-in popup closed before completion.';
    case 'auth/account-exists-with-different-credential': return 'An account already exists with the same email address but different sign-in credentials. Try signing in using a provider associated with this email address.';
    // Add other common error codes as needed
    default: return 'An unexpected authentication error occurred.';
  }
}
