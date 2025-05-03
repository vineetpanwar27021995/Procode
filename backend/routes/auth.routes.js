const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validators = require('../utils/validators');

const verifyFirebaseToken = require('../middlewares/authMiddleware'); // Adjust path

router.post('/register', validators.validateSignup, authController.signup);
router.post('/login', validators.validateLogin, authController.login);
router.post('/forgot-password', validators.validateEmail, authController.forgotPassword);
// router.post('/verify-token', authController.verifyToken);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationCode);
// --- Social Login Endpoints (No middleware needed here, token is in body) ---
router.post('/google/login', authController.googleLogin);
router.post('/facebook/login', authController.facebookLogin);

// --- Token Verification / Get User Endpoint (Middleware REQUIRED) ---
router.get('/me', verifyFirebaseToken, authController.verifyToken); // Example endpoint name

module.exports = router;