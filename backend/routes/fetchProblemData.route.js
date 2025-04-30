const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase'); // your existing initialized Firestore

router.post('/problem-metadata', async (req, res, next) => {
  try {
    const { problemId, categoryId } = req.body;
    console.log('Received problemId:', problemId, categoryId);

    if (!problemId) {
      return res.status(400).json({ error: "Missing problemId" });
    }

    // Firestore path: /category/dsa/Arrays & Hashing/{problemId}
    const docRef = db
      .collection('category')
      .doc('dsa')
      .collection(categoryId)
      .doc(problemId); // e.g. "anagram-groups"

    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `No problem found for ID '${problemId}'` });
    }

    const data = doc.data();

    return res.status(200).json({ problem: data });
  } catch (err) {
    console.error('Error fetching problem from Firestore:', err);
    return next(err);
  }
});
module.exports = router;