const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // or global fetch if using Node 18+

const ANAM_API_KEY = process.env.ANAM_API_KEY;
const ANAM_TOKEN_URL = 'https://api.anam.ai/v1/auth/session-token';

// Retry helper
async function fetchSessionTokenWithRetries(maxRetries = 3, delay = 1000) {
  let attempt = 0;
  console.log("Fetching session token...", process.env.ANAM_API_KEY);

  while (attempt < maxRetries) {
    try {
      const res = await fetch('https://api.anam.ai/v1/auth/session-token', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ZGUxMDQ4NzUtZWQzOS00MzUwLWE1ODctY2ZkY2QxNDY3MmFlOnZ0Zi94N1ZYT05kUkFSQ3dvbng0cS95ZjYrc1BNdmttVENya2ZHd1dEK0E9`
      },
      cache: 'no-cache',
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);

      const data = await res.json();

      console.log("Data from response:", data.sessionToken);
      if(data.sessionToken) return  data.sessionToken;
      throw new Error("Missing sessionToken in response");

    } catch (err) {
      attempt++;
      console.warn(`Attempt ${attempt} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, delay));
      } else {
        throw new Error("All attempts to fetch session token failed");
      }
    }
  }
}

// Route
router.get('/anam/session-token', async (req, res) => {
  try {
    const sessionToken = await fetchSessionTokenWithRetries();
    res.status(200).json({ sessionToken });
  } catch (err) {
    console.error("Failed to get session token:", err.message);
    res.status(500).json({ error: "Failed to fetch Anam session token" });
  }
});

module.exports = router;