const { body } = require('express-validator');
const { auth } = require('../config/firebase');

exports.validateSignup = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom(async (email) => {
      try {
        await auth.getUserByEmail(email);
        throw new Error('Email already in use');
      } catch (error) {
        if (error.code === 'auth/user-not-found') return true;
        throw error;
      }
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('displayName')
    .notEmpty()
    .withMessage('Display name is required')
];

exports.validateLogin = [
  body('uid')
    .notEmpty()
    .withMessage('UID is required')
];

exports.validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
];