const axios = require("axios");

/**
 * Polls Judge0 for result based on token.
 * It checks every 1 second instead of 2-3 seconds for faster feedback.
 */
const pollJudge0Result = async (token) => {
  const JUDGE0_API = "https://judge0-ce.p.rapidapi.com/submissions";

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const res = await axios.get(`${JUDGE0_API}/${token}?base64_encoded=false`, {
          headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        });

        const result = res.data;

        if (
          result.status.id === 1 || // In Queue
          result.status.id === 2    // Processing
        ) {
          // 🔥 Still processing - check again after 1000ms
          setTimeout(poll, 500);
        } else {
          // ✅ Finished
          console.log('pollJudge0Result',result);
          resolve(result);
        }
      } catch (err) {
        console.log('pollJudge0Result err',err);

        reject(err);
      }
    };

    poll();
  });
};

module.exports = pollJudge0Result;
