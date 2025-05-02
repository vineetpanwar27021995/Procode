const jwt = require('jsonwebtoken');
const { admin, auth, db } = require('../config/firebase');
const { JWT, EMAIL_VERIFICATION } = require('../config/constants');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');
const {AppError} = require('../utils/errorHandler');
const axios = require('axios');

exports.signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required.', 400);
    }

    const user = await auth.createUser({ 
      email, 
      password, 
      displayName: name,
      emailVerified: false
    });

    await db.collection('users').doc(user.uid).set({
      email,
      name,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const otpExpiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 10 * 60 * 1000) // 10 mins
    );

    await db.collection('verificationOtps').doc(user.uid).set({
      otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: otpExpiresAt
    });

    await sendVerificationEmail(email, otp); // 🔥 send 4-digit OTP

    res.status(201).json({ 
      message: 'User created. OTP sent to email.', 
      uid: user.uid 
    });

  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error('Email and password are required');

    // Firebase Authentication API URL
    const url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+process.env.FIREBASE_API_KEY;  // Replace with your Firebase Web API Key

    // Making the API call to Firebase Authentication to sign in the user
    const response = await axios.post(url, {
      email,
      password,
      returnSecureToken: true,  // Ensure Firebase returns a secure token
    });

    const { idToken, localId } = response.data;

    // Optionally, you can verify the token and fetch the user's details
    const userRecord = await auth.getUser(localId);  // Using Admin SDK to get user data by localId

    // If needed, create a custom token for the user
    const customToken = await auth.createCustomToken(localId);

    // Send the response with the custom token, user data, and ID token
    res.status(200).json({
      token: customToken,
      idToken,  // Optionally send Firebase's ID token as well
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        // Add other fields as necessary
      },
    });
  } catch (err) {
    next(new AppError(err.message || 'Login failed', 400));
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Email is required.', 400));
    }

    console.log(`Initiating password reset for: ${email}`);

    // Configure action code settings (redirect URL after reset)
    const actionCodeSettings = {
        url: process.env.PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3000/login?passwordReset=true', // Example redirect URL
        handleCodeInApp: false
    };

    // Generate the password reset link using the Admin SDK
    const link = await auth.generatePasswordResetLink(email, actionCodeSettings);
    console.log(`Password reset link generated for ${email}`);

    // --- MODIFIED: Use Option B - Send the email yourself ---
    try {
      // Call your custom email sending function with the generated link
      await sendPasswordResetEmail(email, link);
      console.log(`Custom password reset email sent to ${email}`);
      // Send success response to the client
      res.status(200).json({ message: 'Password reset email sent successfully. Please check your inbox.' });
    } catch (emailError) {
      console.error(`Failed to send custom password reset email to ${email}:`, emailError);
      // Pass the email sending error to the error handler
      return next(new AppError(emailError.message || 'Failed to send password reset email.', 500));
    }

  } catch (err) {
    // Catch errors from generatePasswordResetLink (e.g., user not found)
    console.error("Error generating password reset link:", err);
    // Provide a generic message to avoid revealing if an email exists
    next(new AppError(err.message || 'Failed to initiate password reset.', 400));
  }
};

exports.verifyToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) throw new Error('No token provided');

    const decodedToken = await auth.verifyIdToken(idToken);
    res.status(200).json({ message: 'Token verified', user: decodedToken });
  } catch (err) {
    next(new AppError('Invalid token', 403));
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }

    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    console.log('User UID:', uid); // Log the UID for debugging

    const otpDoc = await db.collection('verificationOtps').doc(uid).get();
    console.log('OTP Document Data:', otpDoc.data()); // Log OTP data for debugging

    if (!otpDoc.exists) {
      throw new Error('Verification code not found');
    }

    const { code, createdAt } = otpDoc.data();

    if (code !== otp) {
      throw new Error('Invalid verification code');
    }

    const now = new Date();
    const created = createdAt.toDate();
    const diffInMinutes = (now - created) / 60000;
    if (diffInMinutes > 10) {
      throw new Error('Verification code expired');
    }

    await auth.updateUser(uid, { emailVerified: true });
    await db.collection('users').doc(uid).update({ emailVerified: true });

    await db.collection('verificationTokens').doc(uid).delete();

    res.status(200).json({ message: 'Email verified successfully' });

  } catch (err) {
    console.error('Verification error:', err); // Log error for debugging
    next(new AppError(err.message, 400));
  }
};

exports.resendVerificationCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new Error('Email is required');
    }

    // Check if user exists
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Generate a new 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP

    // Set expiration time (10 minutes)
    const otpExpiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    );

    // Save OTP and expiration time in Firestore
    await db.collection('verificationOtps').doc(uid).set({
      code: otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: otpExpiresAt,
    });

    // Send OTP to email
    await sendVerificationEmail(email, otp);

    res.status(200).json({
      message: 'Verification code resent successfully',
    });
  } catch (err) {
    next(new AppError(err.message, 400)); // Use your custom error handler
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new Error('No token provided');

    const decodedToken = await auth.verifyIdToken(token);
    
    const userRef = db.collection('users').doc(decodedToken.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      await userRef.set({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        photoURL: decodedToken.picture || null,
        provider: 'google',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: true
      });
    }

    const customToken = await auth.createCustomToken(decodedToken.uid);
    
    res.status(200).json({
      message: 'Google login successful',
      token: customToken,
      user: decodedToken
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.facebookLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new Error('No token provided');

    const decodedToken = await auth.verifyIdToken(token);
    
    const userRef = db.collection('users').doc(decodedToken.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      await userRef.set({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || decodedToken.email,
        photoURL: decodedToken.picture || null,
        provider: 'facebook',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        emailVerified: true
      });
    }

    const customToken = await auth.createCustomToken(decodedToken.uid);
    
    res.status(200).json({
      message: 'Facebook login successful',
      token: customToken,
      user: decodedToken
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};