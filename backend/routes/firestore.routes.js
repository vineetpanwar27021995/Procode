const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/add-user-data', authMiddleware, async (req, res, next) => {
  try {
    const { uid, data } = req.body;
    await db.collection('users').doc(uid).set(data, { merge: true });
    res.status(200).json({ message: 'Data saved' });
  } catch (err) {
    next(err);
  }
});

router.get('/get-user/:uid', authMiddleware, async (req, res, next) => {
  try {
    const doc = await db.collection('users').doc(req.params.uid).get();
    if (!doc.exists) throw new Error('User not found');
    res.json(doc.data());
  } catch (err) {
    next(err);
  }
});

module.exports = router;