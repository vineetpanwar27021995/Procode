const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/authMiddleware'); 
const problemsController = require('../controllers/problemController');

router.get('/roadmap', verifyFirebaseToken, problemsController.fetchRoadmap);
router.get('/categories', verifyFirebaseToken, problemsController.fetchCategories);

module.exports = router;