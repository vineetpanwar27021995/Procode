const { db } = require('../config/firebase'); 


exports.getRoadmap = async () => {
  try {
    const roadmapRef = db.collection('roadmap').doc('dsa');
    const docSnap = await roadmapRef.get();

    if (!docSnap.exists) {
      console.log('Roadmap document (roadmap/dsa) not found!');
      return null;
    }

    const data = docSnap.data();
    if (Array.isArray(data?.categories)) {
      return data.categories;
    } else {
      console.log("Roadmap document exists but 'categories' field is missing or not an array.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching DSA roadmap:", error);
    throw new Error('Failed to fetch DSA roadmap'); 
  }
};


exports.getCategoriesWithData = async () => {
  try {
    // Reference the top-level 'problems' collection
    const problemsCollectionRef = db.collection('problems');
    // *** Use .get() to fetch documents, NOT listCollections() ***
    const snapshot = await problemsCollectionRef.get(); // Get all documents in the collection

    const allCategoryData = {};

    if (snapshot.empty) {
      console.log('No categories found in the "problems" collection.');
      return {}; // Return empty object if collection is empty
    }

    // Iterate through each document (each document represents a category)
    snapshot.forEach(doc => {
      const categoryName = doc.id; // The document ID is the category name
      const problemsInCategory = doc.data(); // The document data is the object of problems

      // Add the category and its problems to the result object
      // Ensure problemsInCategory is an object, default to empty object if not
      allCategoryData[categoryName] = (typeof problemsInCategory === 'object' && problemsInCategory !== null) ? problemsInCategory : {};

      console.log(`Fetched category '${categoryName}' with ${Object.keys(allCategoryData[categoryName]).length} problems.`);
    });

    return allCategoryData; // Return the object containing all category data

  } catch (error) {
    console.error("Error fetching DSA categories with data:", error);
    throw new Error('Failed to fetch DSA categories with data'); // Throw error for controller to catch
  }
};