const express = require("express");
const axios = require("axios");
const pollJudge0Result = require("../utils/pollJudge0Result");
const router = express.Router();

router.post("/judge", async (req, res) => {
  const { source_code, language_id, stdin } = req.body;

  try {
    const submission = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false",
      { source_code, language_id, stdin },
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const token = submission.data.token;
    const result = await pollJudge0Result(token);

    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to run code", details: err.message });
  }
});

module.exports = router;
