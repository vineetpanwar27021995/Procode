// controllers/userController.js
const userService = require('../services/user.service'); 
const { AppError } = require('../utils/errorHandler'); 

/**
 * Controller to fetch the profile of the currently authenticated user.
 */
const getUserProfile = async (req, res, next) => {
  try {
    // The verifyFirebaseToken middleware should attach the decoded user info to req.user
    const uid = req.user?.uid;

    if (!uid) {
      // This case should ideally be caught by the middleware, but added for safety
      return next(new AppError('Authentication required: User ID not found in token.', 401));
    }

    const userData = await userService.getUserById(uid);

    if (!userData) {
      // If user exists in Auth but not Firestore DB (e.g., signup incomplete)
      return next(new AppError('User profile data not found.', 404));
    }

    // Send back the user data fetched from Firestore
    res.status(200).json({
      message: 'User profile fetched successfully.',
      user: userData
    });

  } catch (error) {
    // Catch errors from the service layer or other unexpected issues
    console.error("Error in getUserProfile controller:", error.message);
    // Pass error to the global error handling middleware
    next(new AppError(error.message || 'Internal server error fetching user profile', 500));
  }
};

module.exports = {
  getUserProfile,
};
