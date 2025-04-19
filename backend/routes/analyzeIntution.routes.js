const express = require('express');
const router = express.Router();
const analyzeService = require('../services/analyze.service');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { response } = req.body;
    if (!response) throw new Error('Missing candidate response');
    
    const feedback = await analyzeService.analyzeIntuition(response);
    res.status(200).json({ feedback });
  } catch (err) {
    next(err);
  }
});

module.exports = router;