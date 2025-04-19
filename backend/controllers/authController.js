const jwt = require('jsonwebtoken');
const { auth, db } = require('../config/firebase');
const { JWT, EMAIL_VERIFICATION } = require('../config/constants');
const { sendVerificationEmail } = require('../services/email.service');
const AppError = require('../utils/errorHandler');

exports.signup = async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    const user = await auth.createUser({ 
      email, 
      password, 
      displayName,
      emailVerified: false
    });

    await db.collection('users').doc(user.uid).set({
      email,
      displayName,
      emailVerified: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const verificationToken = jwt.sign(
      { uid: user.uid },
      EMAIL_VERIFICATION.TOKEN_SECRET,
      { expiresIn: EMAIL_VERIFICATION.TOKEN_EXPIRES_IN }
    );

    await db.collection('verificationTokens').doc(user.uid).set({
      token: verificationToken,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await sendVerificationEmail(email, verificationToken);

    res.status(201).json({ 
      message: 'User created. Verification email sent.', 
      uid: user.uid 
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { uid } = req.body;
    if (!uid) throw new Error('UID is required');

    const customToken = await auth.createCustomToken(uid);
    res.status(200).json({ token: customToken });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const link = await auth.generatePasswordResetLink(email);
    res.status(200).json({ message: 'Password reset link sent', link });
  } catch (err) {
    next(new AppError(err.message, 400));
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
    const { token } = req.query;
    const decoded = jwt.verify(token, EMAIL_VERIFICATION.TOKEN_SECRET);

    const tokenDoc = await db.collection('verificationTokens').doc(decoded.uid).get();
    if (!tokenDoc.exists || tokenDoc.data().token !== token) {
      throw new Error('Invalid or expired verification token');
    }

    await auth.updateUser(decoded.uid, { emailVerified: true });
    await db.collection('users').doc(decoded.uid).update({ emailVerified: true });
    await db.collection('verificationTokens').doc(decoded.uid).delete();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    next(new AppError(err.message, 400));
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
        displayName: decodedToken.name || decodedToken.email,
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
        displayName: decodedToken.name || decodedToken.email,
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