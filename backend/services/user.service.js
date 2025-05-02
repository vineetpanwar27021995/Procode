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

    // --- NEW: Fetch Submissions Subcollection ---
    const submissionsRef = userRef.collection('submissions');
    const submissionsSnapshot = await submissionsRef.get();

    const submissionsData = {}; // Store submissions as an object: { problemId: submissionDocData }
    if (!submissionsSnapshot.empty) {
      submissionsSnapshot.forEach(doc => {
        // Use the document ID (which seems to be the problem ID like 'duplicate-integer') as the key
        submissionsData[doc.id] = doc.data();
      });
      console.log(`Fetched ${Object.keys(submissionsData).length} submissions for UID: ${uid}`);
    } else {
      console.log(`No submissions found for UID: ${uid}`);
    }

    // Add the submissions data to the main user data object
    userData.submissions = submissionsData;
    // --- End Fetch Submissions ---

    return userData; // Return combined user data

  } catch (error) {
    console.error(`Error fetching user data and submissions from Firestore for UID ${uid}:`, error);
    // Re-throw a generic error for the controller to catch
    throw new Error('Failed to fetch user profile data');
  }
};

module.exports = {
  getUserById,
};
