// services/userService.js
const { db } = require('../config/firebase'); // Adjust path to your initialized db export
const { AppError } = require('../utils/errorHandler'); // Adjust path to your error handler

/**
 * Fetches user data from the 'users' collection by UID, including data
 * from the 'submissions' subcollection.
 * @param {string} uid - The user's unique ID.
 * @returns {Promise<object|null>} A promise that resolves to the user data object
 * (including a 'submissions' key) or null if the main user document is not found.
 */
const getUserById = async (uid) => {
  if (!uid) {
    console.error("getUserById: UID is required.");
    return null;
  }

  try {
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      console.log(`User document not found in Firestore for UID: ${uid}`);
      return null; // User not found in the 'users' collection
    }

    // Get the main user data
    const userData = docSnap.data();

    // Fetch Submissions Subcollection
    const submissionsRef = userRef.collection('submissions');
    const submissionsSnapshot = await submissionsRef.get();

    const submissionsData = {}; // Store submissions as an object: { problemId: submissionDocData }
    if (!submissionsSnapshot.empty) {
      submissionsSnapshot.forEach(doc => {
        submissionsData[doc.id] = doc.data();
      });
      // console.log(`Fetched ${Object.keys(submissionsData).length} submissions for UID: ${uid}`);
    } else {
      // console.log(`No submissions found for UID: ${uid}`);
    }

    // Add the submissions data to the main user data object
    userData.submissions = submissionsData;

    return userData; // Return combined user data

  } catch (error) {
    console.error(`Error fetching user data and submissions from Firestore for UID ${uid}:`, error);
    // Re-throw a generic error for the controller to catch
    throw new Error('Failed to fetch user profile data');
  }
};

/**
 * Updates specific fields in a user's document in Firestore.
 * @param {string} uid - The user's unique ID.
 * @param {object} updateData - An object containing the fields to update (e.g., { name, pronouns, preferredLanguage, photoURL }).
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
const updateUserById = async (uid, updateData) => {
    if (!uid) {
        throw new AppError('User ID is required for update.', 400);
    }
    if (!updateData || Object.keys(updateData).length === 0) {
        throw new AppError('No update data provided.', 400);
    }

    // Optional: Filter out any fields you don't want to allow updates for directly here
    // Or rely on the controller to send only appropriate fields
    const allowedFields = ['name', 'pronouns', 'preferredLanguage', 'photoURL'];
    const filteredData = {};
    for (const key in updateData) {
        // Only include allowed fields that are explicitly provided (not undefined)
        if (allowedFields.includes(key) && updateData[key] !== undefined) {
            filteredData[key] = updateData[key];
        }
    }

    if (Object.keys(filteredData).length === 0) {
        console.log("No valid fields provided for Firestore update after filtering.");
        // Return successfully as there's nothing to update in Firestore specifically
        return;
    }


    try {
        const userRef = db.collection('users').doc(uid);
        // Use update to modify specific fields without overwriting the whole document
        await userRef.update(filteredData);
        console.log(`User document updated successfully in Firestore for UID: ${uid}`);
    } catch (error) {
        console.error(`Error updating user data in Firestore for UID ${uid}:`, error);
        if (error.code === 5) { // Firestore 'NOT_FOUND' error code
             throw new AppError('User profile not found in Firestore.', 404);
        }
        // Re-throw as a generic AppError for the controller
        throw new AppError('Failed to update user profile data in database.', 500);
    }
};


module.exports = {
  getUserById,
  updateUserById, // Export the new function
};
