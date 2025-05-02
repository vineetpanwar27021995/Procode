// routes/user.routes.js
const express = require('express');
const userController = require('../controllers/userController'); // Adjust path if needed
const verifyFirebaseToken = require('../middlewares/authMiddleware'); // Adjust path
const multer = require('multer'); // Import multer

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Example: 5MB limit
    fileFilter: (req, file, cb) => { // Basic image type check
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Use AppError or pass specific error message
            cb(new Error('Only image files (JPEG, PNG, WEBP, GIF) are allowed!'), false);
        }
    }
});

const router = express.Router();

// Route to get the current authenticated user's profile data
// GET /api/users/me
router.get('/me', verifyFirebaseToken, userController.getUserProfile);

// Route to update the current authenticated user's profile data (non-image fields)
// PUT /api/users/me
router.put('/me', verifyFirebaseToken, userController.updateUserProfile);

// Route to update the current authenticated user's profile picture
// POST /api/users/me/picture
router.post(
    '/me/picture',
    verifyFirebaseToken, // Ensure user is authenticated
    upload.single('profilePicture'), // Use multer middleware for single file upload
                                     // 'profilePicture' MUST match the key used in FormData on the frontend
    userController.updateProfilePicture // Controller to handle the upload logic
);


module.exports = router;
