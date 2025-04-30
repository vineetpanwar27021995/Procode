const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');

router.post('/submission/load', async (req, res) => {
  const { uid, questionId } = req.body;

  if (!uid || !questionId) {
    return res.status(400).json({ error: 'Missing uid or questionId' });
  }

  try {
    const docRef = db
      .collection('users')
      .doc(uid)
      .collection('submissions')
      .doc(questionId);

    const doc = await docRef.get();
    if (!doc.exists) return res.json({});

    res.json(doc.data());
  } catch (err) {
    console.error("❌ Load error:", err);
    res.status(500).send("Load failed");
  }
});

module.exports = router;