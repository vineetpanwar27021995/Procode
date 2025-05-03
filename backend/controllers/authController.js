// controllers/authController.js
const { admin, auth, db } = require('../config/firebase'); // Adjust path if needed
const { AppError } = require('../utils/errorHandler'); // Adjust path if needed
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service'); // Adjust path if needed
const axios = require('axios'); // Keep for login if using REST API there

// --- Signup (Keep as is if using custom OTP) ---
exports.signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return next(new AppError('Email, password, and name are required.', 400));
    }
    console.log(`Signup attempt for: ${email}`);
    const user = await auth.createUser({ email, password, displayName: name, emailVerified: false });
    console.log(`Firebase Auth user created: ${user.uid}`);
    await db.collection('users').doc(user.uid).set({
      email, name, emailVerified: false, createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Firestore user document created for: ${user.uid}`);
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
    await db.collection('verificationOtps').doc(user.uid).set({
      code: otp, email: email, createdAt: admin.firestore.FieldValue.serverTimestamp(), expiresAt: otpExpiresAt
    });
    console.log(`Verification OTP stored for: ${user.uid}`);
    await sendVerificationEmail(email, otp);
    console.log(`Verification email sent attempt finished for: ${email}`);
    res.status(201).json({ message: 'User created. OTP sent to email.', uid: user.uid });
  } catch (err) {
    console.error("Signup Error:", err);
    if (err.code === 'auth/email-already-exists') {
        return next(new AppError('The email address is already in use by another account.', 409));
    }
    next(new AppError(err.message || 'User registration failed.', 400));
  }
};

// --- Login (Email/Password - Keep as is if using REST API for this) ---
// Alternatively, you could remove this if frontend uses Firebase Client SDK for email/pass login too
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Email and password are required', 400));
    }
    console.log(`Login attempt for: ${email}`);

    // Optional: Check verification status in Firestore first
    const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userQuery.empty) return next(new AppError('User not found.', 404));
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    if (!userData.emailVerified) {
        return next(new AppError('Email not verified. Please check your inbox or resend the verification code.', 403));
    }
    console.log(`Email verified check passed for: ${email}`);

    // Proceed with Firebase REST API sign-in
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;
    const response = await axios.post(url, { email, password, returnSecureToken: true });
    console.log(`Firebase REST API login successful for: ${email}`);
    const { idToken, localId } = response.data;
    const userRecord = await auth.getUser(localId); // Get full Auth record

    // Merge Firestore data with Auth data
    const finalUserData = {
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        photoURL: userRecord.photoURL,
        createdAt: userData.createdAt, // From Firestore
        pronouns: userData.pronouns, // From Firestore
        preferredLanguage: userData.preferredLanguage, // From Firestore
        submissions: userData.submissions || {} // Include submissions if available
    };

    res.status(200).json({
      message: "Login successful",
      idToken, // Send Firebase ID token
      user: finalUserData // Send merged user data
    });
  } catch (err) {
    console.error("Login Error:", err.response?.data || err.message);
    if (err.response?.data?.error?.message === 'INVALID_LOGIN_CREDENTIALS' || err.response?.data?.error?.message === 'INVALID_PASSWORD') {
         return next(new AppError('Invalid email or password.', 401));
    }
     if (err.response?.data?.error?.message === 'EMAIL_NOT_FOUND') {
         return next(new AppError('User not found.', 404));
    }
    next(new AppError(err.message || 'Login failed', 400));
  }
};

// --- Verify Email (Keep as is for custom OTP flow) ---
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return next(new AppError('Email and OTP are required', 400));
    if (typeof otp !== 'string' || otp.length !== 4 || !/^\d+$/.test(otp)) {
         return next(new AppError('Invalid OTP format. Must be 4 digits.', 400));
    }
    console.log(`Verify email attempt for: ${email} with OTP: ${otp}`);
    let userRecord;
    try { userRecord = await auth.getUserByEmail(email); }
    catch (userError) { return next(new AppError('User with this email not found.', 404)); }
    const uid = userRecord.uid;
    console.log(`User UID found: ${uid}`);
    const otpDocRef = db.collection('verificationOtps').doc(uid);
    const otpDoc = await otpDocRef.get();
    if (!otpDoc.exists) return next(new AppError('Verification code not found or expired.', 404));
    const otpData = otpDoc.data();
    if (!otpData.code || otpData.code !== otp) return next(new AppError('Invalid verification code.', 400));
    if (!otpData.expiresAt) return next(new AppError('Verification data is corrupted.', 500));
    const now = admin.firestore.Timestamp.now();
    if (now.seconds > otpData.expiresAt.seconds) return next(new AppError('Verification code expired.', 400));
    await auth.updateUser(uid, { emailVerified: true });
    await db.collection('users').doc(uid).update({ emailVerified: true });
    await otpDocRef.delete();
    console.log(`Email verified successfully for UID: ${uid}`);
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Verification error:', err);
    next(new AppError(err.message || 'Email verification failed.', 400));
  }
};

// --- Resend Verification (Keep as is for custom OTP flow) ---
exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Email is required', 400));
    console.log(`Resend verification attempt for: ${email}`);
    let userRecord;
     try { userRecord = await auth.getUserByEmail(email); }
     catch (userError) { return next(new AppError('User with this email not found.', 404)); }
    const uid = userRecord.uid;
    if (userRecord.emailVerified) return res.status(200).json({ message: 'Email is already verified.' });
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
    await db.collection('verificationOtps').doc(uid).set({
      code: otp, email: email, createdAt: admin.firestore.FieldValue.serverTimestamp(), expiresAt: otpExpiresAt,
    });
     console.log(`New verification OTP stored for UID: ${uid}`);
    await sendVerificationEmail(email, otp);
     console.log(`Resend verification email attempt finished for: ${email}`);
    res.status(200).json({ message: 'Verification code resent successfully' });
  } catch (err) {
    console.error("Resend Verification Error:", err);
    next(new AppError(err.message || 'Failed to resend verification code.', 500));
  }
};

// --- Forgot Password (Keep as is, uses Admin SDK link + custom email) ---
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return next(new AppError('Email is required.', 400));
    console.log(`Initiating password reset for: ${email}`);
    const actionCodeSettings = {
        url: process.env.PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3000/login?passwordReset=true',
        handleCodeInApp: false
    };
    const link = await auth.generatePasswordResetLink(email, actionCodeSettings);
    console.log(`Password reset link generated for ${email}`);
    try {
      await sendPasswordResetEmail(email, link);
      console.log(`Custom password reset email sent to ${email}`);
      res.status(200).json({ message: 'Password reset email sent successfully. Please check your inbox.' });
    } catch (emailError) {
      console.error(`Failed to send custom password reset email to ${email}:`, emailError);
      return next(new AppError(emailError.message || 'Failed to send password reset email.', 500));
    }
  } catch (err) {
    console.error("Error generating password reset link:", err);
     if (err.code === 'auth/user-not-found') {
         return next(new AppError('User with this email not found.', 404));
    }
    next(new AppError(err.message || 'Failed to initiate password reset.', 400));
  }
};

// --- Verify Token (Keep as is for /users/me endpoint) ---
exports.verifyToken = async (req, res, next) => {
  try {
    if (!req.user) return next(new AppError('Token verification failed in middleware.', 401));
    console.log(`Token verified via middleware for UID: ${req.user.uid}`);
    const userDataSnap = await db.collection('users').doc(req.user.uid).get();
    if (!userDataSnap.exists) {
         console.warn(`Token verified but no user data found in Firestore for UID: ${req.user.uid}`);
         // Return basic info from token if Firestore doc missing
          res.status(200).json({ message: 'Token verified, user profile incomplete.', user: {
              uid: req.user.uid,
              email: req.user.email,
              name: req.user.name,
              photoURL: req.user.picture,
              emailVerified: req.user.email_verified
          } });
          return;
    }
    // Merge Firestore data with token data (token data might be slightly more up-to-date for core fields)
    const firestoreData = userDataSnap.data();
    const responseUser = {
        ...firestoreData, // Start with Firestore data
        uid: req.user.uid, // Ensure correct UID from token
        email: req.user.email, // Ensure correct email from token
        name: req.user.name || firestoreData.name, // Prefer token name if available
        photoURL: req.user.picture || firestoreData.photoURL, // Prefer token picture if available
        emailVerified: req.user.email_verified, // Use verified status from token
    };
    res.status(200).json({ message: 'Token verified', user: responseUser });
  } catch (err) {
    console.error("Error in verifyToken controller:", err);
    next(new AppError('Invalid token or server error.', 403));
  }
};


// --- MODIFIED: Google Login - Verify ID Token & Find/Create User ---
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body; // Expect Firebase ID Token from Client SDK
    if (!token) return next(new AppError('No Google ID token provided', 400));

    // Verify the ID token using Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log(`Google Sign-In VERIFIED for UID: ${uid}, Email: ${decodedToken.email}`);

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let userData;
    let isNewUser = false;
    if (!doc.exists) {
      isNewUser = true;
      console.log(`Creating new user document for Google Sign-In: ${uid}`);
      userData = {
        uid: uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email?.split('@')[0] || `User_${uid.substring(0,5)}`,
        photoURL: decodedToken.picture || null,
        provider: 'google.com', // Use standard provider ID
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: decodedToken.email_verified || true // Assume verified from Google
        // Initialize other fields like pronouns, language, submissions if needed
        // pronouns: 'Not Specified',
        // preferredLanguage: 'Not Specified',
        // submissions: {}
      };
      await userRef.set(userData);
    } else {
      userData = doc.data();
      // Optional: Update existing user data if needed (e.g., photoURL, name)
       const updates = {};
       if (decodedToken.name && userData.name !== decodedToken.name) updates.name = decodedToken.name;
       if (decodedToken.picture && userData.photoURL !== decodedToken.picture) updates.photoURL = decodedToken.picture;
       if (!userData.emailVerified && decodedToken.email_verified) updates.emailVerified = true;
       if (Object.keys(updates).length > 0) {
           await userRef.update(updates);
           userData = { ...userData, ...updates };
           console.log(`Updated existing user document for Google Sign-In: ${uid}`);
       }
    }

    // Return the user data from Firestore (which now includes submissions potentially)
    // No need to send back a custom token or the original idToken usually
    res.status(isNewUser ? 201 : 200).json({
      message: 'Google login successful',
      user: userData // Send user data from your Firestore DB
    });
  } catch (err) {
     console.error("Google Login Error:", err);
     // Handle specific errors like invalid token
     if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
         return next(new AppError('Invalid or expired Google token.', 401));
     }
    next(new AppError(err.message || 'Google login failed.', 400));
  }
};

// --- MODIFIED: Facebook Login - Verify ID Token & Find/Create User ---
exports.facebookLogin = async (req, res, next) => {
   try {
    const { token } = req.body; // Expect Firebase ID Token from Client SDK (after signInWithCredential)
    if (!token) return next(new AppError('No Facebook ID token provided', 400));

    // Verify the ID token using Admin SDK
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
     console.log(`Facebook Sign-In VERIFIED for UID: ${uid}, Email: ${decodedToken.email}`);

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let userData;
    let isNewUser = false;
    if (!doc.exists) {
       isNewUser = true;
       console.log(`Creating new user document for Facebook Sign-In: ${uid}`);
       userData = {
         uid: uid,
         email: decodedToken.email || null, // Email might be null from FB
         name: decodedToken.name || `User_${uid.substring(0,5)}`,
         photoURL: decodedToken.picture || null,
         provider: 'facebook.com', // Standard provider ID
         createdAt: admin.firestore.FieldValue.serverTimestamp(),
         emailVerified: decodedToken.email_verified || false // Assume false unless FB guarantees
         // Initialize other fields
       };
       await userRef.set(userData);
    } else {
         userData = doc.data();
         // Optional: Update fields
          const updates = {};
          if (decodedToken.name && userData.name !== decodedToken.name) updates.name = decodedToken.name;
          if (decodedToken.picture && userData.photoURL !== decodedToken.picture) updates.photoURL = decodedToken.picture;
          // Don't automatically mark email as verified
          if (Object.keys(updates).length > 0) {
              await userRef.update(updates);
              userData = { ...userData, ...updates };
              console.log(`Updated existing user document for Facebook Sign-In: ${uid}`);
          }
    }

    res.status(isNewUser ? 201 : 200).json({
      message: 'Facebook login successful',
      user: userData // Send user data from your Firestore DB
    });
  } catch (err) {
     console.error("Facebook Login Error:", err);
      if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
         return next(new AppError('Invalid or expired Facebook token.', 401));
     }
    next(new AppError(err.message || 'Facebook login failed.', 400));
  }
};

