// controllers/userController.js
const userService = require('../services/user.service'); // Adjust path if needed
const admin = require('firebase-admin'); // Import admin SDK for Storage/Auth updates
const { auth } = require('../config/firebase'); // Import Admin Auth instance
const { AppError } = require('../utils/errorHandler'); // Adjust path if needed

/**
 * Controller to fetch the profile of the currently authenticated user.
 */
const getUserProfile = async (req, res, next) => {
  try {
    const uid = req.user?.uid; // From verifyFirebaseToken middleware

    if (!uid) {
      return next(new AppError('Authentication required: User ID not found in token.', 401));
    }

    const userData = await userService.getUserById(uid);

    if (!userData) {
      return next(new AppError('User profile data not found.', 404));
    }

    res.status(200).json({
      message: 'User profile fetched successfully.',
      user: userData // Includes submissions if fetched by service
    });

  } catch (error) {
    console.error("Error in getUserProfile controller:", error.message);
    next(new AppError(error.message || 'Internal server error fetching user profile', 500));
  }
};

/**
 * Controller to update the profile (non-image fields) of the currently authenticated user.
 */
const updateUserProfile = async (req, res, next) => {
    try {
        const uid = req.user?.uid;
        // Exclude photoURL from this update, handle via separate endpoint
        const { photoURL, ...updateData } = req.body;

        if (!uid) {
            return next(new AppError('Authentication required.', 401));
        }
        if (!updateData || Object.keys(updateData).length === 0) {
            return next(new AppError('No update data provided.', 400));
        }

        // --- Separate updates for Firebase Auth and Firestore ---

        // 1. Update Firebase Auth profile (only displayName)
        const authUpdatePayload = {};
        if (updateData.name !== undefined) {
            authUpdatePayload.displayName = updateData.name;
        }
        // Note: photoURL is handled by updateProfilePicture controller

        if (Object.keys(authUpdatePayload).length > 0) {
            try {
                await auth.updateUser(uid, authUpdatePayload);
                console.log(`Firebase Auth profile updated for UID: ${uid}`);
            } catch (authError) {
                 console.error(`Error updating Firebase Auth profile for UID ${uid}:`, authError);
                 return next(new AppError('Failed to update core user profile.', 500));
            }
        }

        // 2. Update Firestore 'users' document (includes custom fields like pronouns, language)
        // Service function filters allowed fields
        await userService.updateUserById(uid, updateData);

        // 3. Fetch the updated data to return to the client
        const updatedUserData = await userService.getUserById(uid);

        res.status(200).json({
            message: 'User profile updated successfully.',
            user: updatedUserData // Return the complete updated profile
        });

    } catch (error) {
        console.error("Error in updateUserProfile controller:", error.message);
        next(new AppError(error.message || 'Internal server error updating user profile', error.statusCode || 500));
    }
};


/**
 * Controller to handle profile picture upload, update Auth/Firestore, and return updated profile.
 */
exports.updateProfilePicture = async (req, res, next) => {
    try {
        const uid = req.user?.uid;
        const file = req.file; // File object processed by multer

        if (!uid) {
            return next(new AppError('Authentication required.', 401));
        }
        if (!file) {
            return next(new AppError('No image found uploaded.', 400));
        }

        // 1. Upload to Firebase Storage (using Admin SDK)
        const bucket = admin.storage().bucket(); // Default bucket
        // Ensure file extension handling is robust
        const originalNameParts = file.originalname.split('.');
        const fileExtension = originalNameParts.length > 1 ? originalNameParts.pop() : 'jpg'; // Default extension
        const fileName = `profilePictures/${uid}/profile.${fileExtension}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                cacheControl: 'public, max-age=3600' // Example cache control
            },
             public: true, // Make file publicly readable
            // predefinedAcl: 'publicRead' // Alternative way
        });

        blobStream.on('error', (err) => {
            console.error("Storage Upload Error:", err);
            // Pass error to the main error handler
            return next(new AppError('Failed to upload image to storage.', 500));
        });

        blobStream.on('finish', async () => {
            // File successfully uploaded
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            console.log(`File uploaded to ${publicUrl}`);

            try {
                // 2. Update Firebase Auth profile picture URL
                await auth.updateUser(uid, { photoURL: publicUrl });
                console.log(`Firebase Auth photoURL updated for ${uid}`);

                // 3. Update Firestore document
                await userService.updateUserById(uid, { photoURL: publicUrl });
                console.log(`Firestore photoURL updated for ${uid}`);

                // 4. Fetch the latest user data to return
                const updatedUserData = await userService.getUserById(uid);

                res.status(200).json({
                    message: 'Profile picture updated successfully.',
                    user: updatedUserData // Return updated profile
                });
            } catch (updateError) {
                 console.error(`Error updating Auth/Firestore for ${uid} after upload:`, updateError);
                 // Use next to pass the error to the handler
                 return next(new AppError('Image uploaded but failed to update profile records.', 500));
            }
        });

        // End the stream with the file buffer from multer
        blobStream.end(file.buffer);

    } catch (error) {
        // Catch errors before streaming starts or other unexpected errors
        console.error("Error in updateProfilePicture controller:", error);
        next(new AppError(error.message || 'Internal server error updating profile picture.', 500));
    }
};


module.exports = {
  getUserProfile,
  updateUserProfile, // Export the updated controller
  updateProfilePicture: exports.updateProfilePicture, // Export the new controller
};

