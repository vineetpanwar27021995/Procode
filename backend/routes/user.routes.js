// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); 
const verifyFirebaseToken = require('../middlewares/authMiddleware'); // Adjust path


// Route to get the current authenticated user's profile data
// GET /api/users/me (assuming '/api/users' prefix is added in server.js)
router.get('/me', verifyFirebaseToken, userController.getUserProfile);

// Add other user-related routes here if needed (e.g., update profile)
// router.put('/me', verifyFirebaseToken, userController.updateUserProfile);

module.exports = router;