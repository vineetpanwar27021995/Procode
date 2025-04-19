const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validators = require('../utils/validators');

router.post('/signup', validators.validateSignup, authController.signup);
router.post('/login', validators.validateLogin, authController.login);
router.post('/forgot-password', validators.validateEmail, authController.forgotPassword);
router.post('/verify-token', authController.verifyToken);
router.get('/verify-email', authController.verifyEmail);
router.post('/google', authController.googleLogin);
router.post('/facebook', authController.facebookLogin);

module.exports = router;