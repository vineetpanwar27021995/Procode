const express = require('express');
const router = express.Router();

router.post('/problem-metadata', async (req, res, next) => {
  try {
    const { problemId } = req.body;
    const response = await fetch("https://us-central1-neetcode-dd170.cloudfunctions.net/getProblemMetadataFunction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        Origin: "https://neetcode.io",
        Referer: "https://neetcode.io/",
      },
      body: JSON.stringify({ data: { problemId } }),
    });

    const result = await response.json();
    res.status(200).json({ problem: result.result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;