const problemsService = require('../services/problems.service'); 

exports.fetchRoadmap = async (req, res, next) => {
  try {
    const roadmap = await problemsService.getRoadmap();
    if (roadmap === null) {
      return res.status(404).json({ message: 'DSA roadmap not found.' });
    }
    res.status(200).json({ roadmap }); 
  } catch (error) {
    console.error("Error in fetchRoadmap controller:", error.message);
    res.status(500).json({ message: error.message || 'Internal server error fetching roadmap' });
  }
};

exports.fetchCategories = async (req, res, next) => {
  try {
    const categories = await problemsService.getCategoriesWithData();
    res.status(200).json({ categories }); 
  } catch (error) {
    console.error("Error in fetchCategories controller:", error.message);
    res.status(500).json({ message: error.message || 'Internal server error fetching categories' });
  }
};
