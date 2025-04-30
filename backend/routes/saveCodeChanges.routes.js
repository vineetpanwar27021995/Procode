const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { analyzeCodeAndConversation } = require('../services/codeReview.service');

router.post('/submit', async (req, res) => {
  const {
    uid,
    code,
    codeDescription,
    categoryId,
    questionId,
    codeResults,
    messages
  } = req.body;

  const timestamp = new Date().toISOString();

  if (!uid || !code || !codeDescription || !categoryId || !questionId || !messages) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const { time, space, summary } = await analyzeCodeAndConversation({
      code,
      codeDescription,
      messages,
    });

    const docRef = db
    .collection('users')
    .doc(uid)
    .collection('submissions') // 🔹 name this however you like
    .doc(questionId);     // e.g. 'duplicate-integer'

    const prevDoc = await docRef.get();
    const prevData = prevDoc.exists ? prevDoc.data() : {};
    const isSuccessfullSubmissions = codeResults && codeResults.every(result => result.status?.description === "Accepted");

    const payload = {
      code,
      USER_TIME_COMPLEXITY: time,
      USER_SPACE_COMPLEXITY: space,
      USER_ATTEMPT_COUNT: (prevData.USER_ATTEMPT_COUNT || 0) + 1,
      SUCCESS_ATTEMPT_COUNT: isSuccessfullSubmissions ? (prevData.SUCCESS_ATTEMPT_COUNT || 0) + 1 : (prevData.SUCCESS_ATTEMPT_COUNT || 0),
      TIMESTAMP: timestamp,
      Brief_Conversation: summary,
      Category: categoryId,
      questionID: questionId,
      codeResults,
    };

    await docRef.set(payload, { merge: true });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Submission save failed:", err);
    res.status(500).json({ error: "Failed to analyze or save submission" });
  }
});

module.exports = router;