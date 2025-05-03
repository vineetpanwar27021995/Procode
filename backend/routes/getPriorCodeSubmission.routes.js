const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const verifyFirebaseToken = require('../middlewares/authMiddleware'); 

router.post('/submission/load',verifyFirebaseToken, async (req, res) => {
  const { questionId } = req.body;

  // if (!uid || !questionId) {
  //   return res.status(400).json({ error: 'Missing uid or questionId' });
  // }
console.log("🚀 Load submission received:", req.user)
  try {
    const docRef = db
      .collection('users')
      .doc(req.user.uid)
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