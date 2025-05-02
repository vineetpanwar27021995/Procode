// controllers/authController.js
const { admin, auth, db } = require('../config/firebase'); // Adjust path if needed
const { AppError } = require('../utils/errorHandler'); // Adjust path if needed
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service'); // Adjust path if needed
const axios = require('axios'); // Keep for login if using REST API there

// --- Signup ---
exports.signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return next(new AppError('Email, password, and name are required.', 400)); // Use return
    }

    console.log(`Signup attempt for: ${email}`);
    const user = await auth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: false // Start as unverified
    });
    console.log(`Firebase Auth user created: ${user.uid}`);

    // Store user details in Firestore
    await db.collection('users').doc(user.uid).set({
      email,
      name,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Firestore user document created for: ${user.uid}`);

    // Generate and store OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const otpExpiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 10 * 60 * 1000) // 10 mins validity
    );

    // --- FIX: Save OTP using 'code' field name ---
    await db.collection('verificationOtps').doc(user.uid).set({
      code: otp, // Use 'code' consistently
      email: email, // Store email for potential reference
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: otpExpiresAt
    });
    console.log(`Verification OTP stored for: ${user.uid}`);

    // Send OTP email
    await sendVerificationEmail(email, otp);
    console.log(`Verification email sent attempt finished for: ${email}`);

    res.status(201).json({
      message: 'User created. OTP sent to email.',
      uid: user.uid // Send UID back if needed by frontend
    });

  } catch (err) {
    console.error("Signup Error:", err); // Log the full error
    // Handle specific Firebase errors if needed (e.g., email-already-exists)
    if (err.code === 'auth/email-already-exists') {
        return next(new AppError('The email address is already in use by another account.', 409)); // 409 Conflict
    }
    next(new AppError(err.message || 'User registration failed.', 400));
  }
};

// --- Login ---
// (Assuming this login method using Firebase REST API is intended and working)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Email and password are required', 400)); // Use return and AppError
    }
    console.log(`Login attempt for: ${email}`);

    // Check if user's email is verified in Firestore before attempting Firebase login
    // Note: This adds an extra DB read but prevents login for unverified users via this endpoint
    const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
    if (userQuery.empty) {
         return next(new AppError('User not found.', 404));
    }
    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    if (!userData.emailVerified) {
        console.warn(`Login attempt failed for ${email}: Email not verified.`);
        // Send specific message asking user to verify
         return next(new AppError('Email not verified. Please check your inbox for the verification code or resend it.', 403)); // 403 Forbidden
    }
    console.log(`Email verified check passed for: ${email}`);


    // Proceed with Firebase REST API sign-in
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;

    const response = await axios.post(url, {
      email,
      password,
      returnSecureToken: true,
    });
    console.log(`Firebase REST API login successful for: ${email}`);

    const { idToken, localId } = response.data;

    // Fetch full user record using Admin SDK (optional but good for consistent user object)
    const userRecord = await auth.getUser(localId);
    const customToken = await auth.createCustomToken(localId);
    // Send back necessary info
    res.status(200).json({
      message: "Login successful",
      token: customToken,
      idToken, // Send Firebase ID token for client-side session/API calls
      user: { // Send user details consistent with your frontend needs
        uid: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        photoURL: userRecord.photoURL,
        // Add other Firestore fields if needed by merging userData
        createdAt: userData.createdAt, // Example from Firestore doc
        pronouns: userData.pronouns, // Example
        preferredLanguage: userData.preferredLanguage, // Example
      },
    });
  } catch (err) {
    console.error("Login Error:", err.response?.data || err.message); // Log specific error
    // Map Firebase REST API errors if possible
    if (err.response?.data?.error?.message === 'INVALID_LOGIN_CREDENTIALS') {
         return next(new AppError('Invalid email or password.', 401)); // Unauthorized
    }
     if (err.response?.data?.error?.message === 'EMAIL_NOT_FOUND') {
         return next(new AppError('User not found.', 404));
    }
    next(new AppError(err.message || 'Login failed', 400));
  }
};


// --- Verify Email ---
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new AppError('Email and OTP are required', 400)); // Use return
    }
    if (typeof otp !== 'string' || otp.length !== 4 || !/^\d+$/.test(otp)) {
         return next(new AppError('Invalid OTP format. Must be 4 digits.', 400));
    }


    console.log(`Verify email attempt for: ${email} with OTP: ${otp}`);
    // Find user by email to get UID
    let userRecord;
    try {
         userRecord = await auth.getUserByEmail(email);
    } catch (userError) {
         if (userError.code === 'auth/user-not-found') {
             return next(new AppError('User with this email not found.', 404));
         }
         throw userError; // Re-throw other auth errors
    }
    const uid = userRecord.uid;
    console.log(`User UID found: ${uid}`);

    // Get OTP document
    const otpDocRef = db.collection('verificationOtps').doc(uid);
    const otpDoc = await otpDocRef.get();

    if (!otpDoc.exists) {
      console.log(`OTP document not found for UID: ${uid}`);
      return next(new AppError('Verification code not found or expired. Please resend.', 404)); // Use return
    }

    const otpData = otpDoc.data();
    console.log('OTP Document Data:', otpData); // Log OTP data

    // --- FIX: Use 'code' field name for comparison ---
    if (!otpData.code || otpData.code !== otp) {
      console.log(`Invalid OTP comparison: Stored=${otpData.code}, Received=${otp}`);
      return next(new AppError('Invalid verification code.', 400)); // Use return
    }

    // --- FIX: Use 'expiresAt' for expiration check ---
    if (!otpData.expiresAt) {
         console.error(`OTP document for UID ${uid} is missing expiresAt field.`);
         return next(new AppError('Verification data is corrupted. Please resend.', 500));
    }
    const now = admin.firestore.Timestamp.now(); // Use Firestore server timestamp for comparison
    if (now.seconds > otpData.expiresAt.seconds) {
      console.log('Verification code expired.');
      return next(new AppError('Verification code expired. Please resend.', 400)); // Use return
    }

    // If code is valid and not expired:
    // 1. Update Firebase Auth user record
    await auth.updateUser(uid, { emailVerified: true });
    console.log(`Firebase Auth emailVerified updated for UID: ${uid}`);
    // 2. Update Firestore user document
    await db.collection('users').doc(uid).update({ emailVerified: true });
    console.log(`Firestore user emailVerified updated for UID: ${uid}`);
    // 3. Delete the used OTP document
    // --- FIX: Delete from correct collection ---
    await otpDocRef.delete();
    console.log(`Verification OTP document deleted for UID: ${uid}`);

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (err) {
    console.error('Verification error:', err); // Log full error
    next(new AppError(err.message || 'Email verification failed.', 400));
  }
};

// --- Resend Verification ---
exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Email is required', 400)); // Use return
    }
    console.log(`Resend verification attempt for: ${email}`);

    // Check if user exists
    let userRecord;
     try {
         userRecord = await auth.getUserByEmail(email);
    } catch (userError) {
         if (userError.code === 'auth/user-not-found') {
             return next(new AppError('User with this email not found.', 404));
         }
         throw userError; // Re-throw other auth errors
    }
    const uid = userRecord.uid;

    // Check if already verified
    if (userRecord.emailVerified) {
        console.log(`Email ${email} is already verified.`);
        return res.status(200).json({ message: 'Email is already verified.' }); // Inform user
    }

    // Generate a new 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    );

    // Save OTP (using 'code' field) and expiration time in Firestore
    await db.collection('verificationOtps').doc(uid).set({
      code: otp, // Use 'code' consistently
      email: email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: otpExpiresAt,
    });
     console.log(`New verification OTP stored for UID: ${uid}`);

    // Send OTP to email
    await sendVerificationEmail(email, otp);
     console.log(`Resend verification email attempt finished for: ${email}`);

    res.status(200).json({
      message: 'Verification code resent successfully',
    });
  } catch (err) {
    console.error("Resend Verification Error:", err);
    next(new AppError(err.message || 'Failed to resend verification code.', 500)); // Use 500 for potential server issues
  }
};


// --- Forgot Password ---
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Email is required.', 400));
    }

    console.log(`Initiating password reset for: ${email}`);

    const actionCodeSettings = {
        url: process.env.PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3000/login?passwordReset=true', // Example redirect URL
        handleCodeInApp: false
    };

    // Generate the password reset link using the Admin SDK
    const link = await auth.generatePasswordResetLink(email, actionCodeSettings);
    console.log(`Password reset link generated for ${email}`);

    // Send the email using your custom service
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
    // Handle user not found specifically if desired
     if (err.code === 'auth/user-not-found') {
         // You might still want to send a generic success message for security
         // return res.status(200).json({ message: 'If an account exists for this email, a password reset link has been sent.' });
         return next(new AppError('User with this email not found.', 404)); // Or reveal error
    }
    next(new AppError(err.message || 'Failed to initiate password reset.', 400));
  }
};

// --- Verify Token (Example - if needed for session check) ---
// Note: Your current frontend uses local decode, so this might not be used directly by checkAuth
exports.verifyToken = async (req, res, next) => {
  try {
    // This relies on the verifyFirebaseToken middleware already running
    // req.user should contain the decoded token payload
    if (!req.user) {
        // Should have been caught by middleware, but double-check
         return next(new AppError('Token verification failed in middleware.', 401));
    }
    console.log(`Token verified via middleware for UID: ${req.user.uid}`);
    // Optionally fetch full user data from Firestore to send back
    const userData = await db.collection('users').doc(req.user.uid).get();
    if (!userData.exists) {
         console.warn(`Token verified but no user data found in Firestore for UID: ${req.user.uid}`);
         // Send back decoded token info only
          res.status(200).json({ message: 'Token verified, user data missing.', user: req.user });
          return;
    }

    res.status(200).json({ message: 'Token verified', user: userData.data() });

  } catch (err) {
    // This catch is mostly for unexpected errors, as middleware handles token errors
    console.error("Error in verifyToken controller:", err);
    next(new AppError('Invalid token or server error.', 403));
  }
};


// --- Social Logins (Keep as they were) ---
exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body; // This is the ID token from Google Sign-In on the client
    if (!token) throw new Error('No Google ID token provided');

    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log(`Google Sign-In attempt for UID: ${uid}, Email: ${decodedToken.email}`);

    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let userData;
    if (!doc.exists) {
      console.log(`Creating new user document for Google Sign-In: ${uid}`);
      userData = {
        uid: uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email.split('@')[0], // Use name or derive from email
        photoURL: decodedToken.picture || null,
        provider: 'google',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: decodedToken.email_verified || true // Assume verified from Google
      };
      await userRef.set(userData);
    } else {
      userData = doc.data();
       // Optional: Update fields like photoURL or name if they changed in Google profile
       const updates = {};
       if (decodedToken.name && userData.name !== decodedToken.name) updates.name = decodedToken.name;
       if (decodedToken.picture && userData.photoURL !== decodedToken.picture) updates.photoURL = decodedToken.picture;
       if (!userData.emailVerified && decodedToken.email_verified) updates.emailVerified = true; // Mark as verified if Google says so
       if (Object.keys(updates).length > 0) {
           await userRef.update(updates);
           userData = { ...userData, ...updates }; // Merge updates for response
           console.log(`Updated existing user document for Google Sign-In: ${uid}`);
       }
    }

    // Create a custom token for backend session management if needed,
    // otherwise, the client can just use the Google ID token directly for API calls.
    // const customToken = await auth.createCustomToken(uid);

    res.status(200).json({
      message: 'Google login successful',
      // token: customToken, // Send custom token if you use it for sessions
      idToken: token, // Send back the original ID token for consistency? Or maybe not needed.
      user: userData // Send merged/created user data from Firestore
    });
  } catch (err) {
     console.error("Google Login Error:", err);
    next(new AppError(err.message || 'Google login failed.', 400));
  }
};

// Facebook Login - Requires similar logic but using Facebook provider details
// Make sure your Firebase project is configured for Facebook Auth
exports.facebookLogin = async (req, res, next) => {
   try {
    const { token } = req.body; // This is the *Access Token* from Facebook Login on the client
    if (!token) throw new Error('No Facebook access token provided');

    // Note: Verifying Facebook tokens usually involves calling Facebook's Graph API.
    // Firebase Admin SDK doesn't directly verify FB access tokens like it does Google ID tokens.
    // You'd typically exchange the FB access token for Firebase credentials on the CLIENT-SIDE
    // using the Firebase Client SDK (signInWithCredential) and then send the resulting
    // Firebase ID token to this backend endpoint for verification/user creation.

    // --- Assuming the 'token' received here is actually a Firebase ID token ---
    // --- obtained after client-side signInWithCredential(facebookCredential) ---
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
     console.log(`Facebook Sign-In attempt for UID: ${uid}, Email: ${decodedToken.email}`);


    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    let userData;
    if (!doc.exists) {
       console.log(`Creating new user document for Facebook Sign-In: ${uid}`);
       userData = {
         uid: uid,
         email: decodedToken.email, // Might be null depending on FB permissions
         name: decodedToken.name || `User_${uid.substring(0,5)}`, // Use name or generate placeholder
         photoURL: decodedToken.picture || null,
         provider: 'facebook.com', // Use standard provider ID
         createdAt: admin.firestore.FieldValue.serverTimestamp(),
         emailVerified: decodedToken.email_verified || false // Email might not be verified via FB
       };
       await userRef.set(userData);
    } else {
         userData = doc.data();
         // Optional: Update fields
          const updates = {};
          if (decodedToken.name && userData.name !== decodedToken.name) updates.name = decodedToken.name;
          if (decodedToken.picture && userData.photoURL !== decodedToken.picture) updates.photoURL = decodedToken.picture;
          // Don't automatically mark email as verified unless FB guarantees it
          if (Object.keys(updates).length > 0) {
              await userRef.update(updates);
              userData = { ...userData, ...updates };
              console.log(`Updated existing user document for Facebook Sign-In: ${uid}`);
          }
    }

    // const customToken = await auth.createCustomToken(uid);

    res.status(200).json({
      message: 'Facebook login successful',
      // token: customToken,
      idToken: token, // Send back original token?
      user: userData
    });
  } catch (err) {
     console.error("Facebook Login Error:", err);
    next(new AppError(err.message || 'Facebook login failed.', 400));
  }
};
