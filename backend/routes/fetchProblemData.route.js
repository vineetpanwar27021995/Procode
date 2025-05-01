const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase'); // your existing initialized Firestore

router.post('/problem-metadata', async (req, res, next) => {
  try {
    const { problemId, categoryId } = req.body;
    console.log('Received problemId:', problemId, categoryId);

    if (!problemId || !categoryId) {
      return res.status(400).json({ error: "Missing problemId or categoryId" });
    }

    // Access the category document
    const categoryDocRef = db.collection('problems').doc(categoryId);
    const categoryDocSnap = await categoryDocRef.get();

    if (!categoryDocSnap.exists) {
      return res.status(404).json({ error: `Category '${categoryId}' not found` });
    }

    const data = categoryDocSnap.data();
    const problemData = data?.[problemId];

    if (!problemData) {
      return res.status(404).json({ error: `Problem '${problemId}' not found in '${categoryId}'` });
    }

    return res.status(200).json({ problem: problemData });

  } catch (err) {
    console.error('Error fetching problem from Firestore:', err);
    return next(err);
  }
});

module.exports = router;