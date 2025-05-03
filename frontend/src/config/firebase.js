// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Optional: import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration from your Firebase project settings
// Read values from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app); // Client-side Auth instance
const db = getFirestore(app); // Client-side Firestore instance (if needed directly)
const storage = getStorage(app); // Client-side Storage instance (if needed directly)
// const analytics = getAnalytics(app); // Optional

console.log("Firebase Client SDK Initialized");

// Export the instances for use in other parts of your app
export { app, auth, db, storage };

