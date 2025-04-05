require("dotenv").config();
const { OpenAI } = require("openai");
const express = require("express");
const router = express.Router();

const openai = new OpenAI({
    baseURL:process.env.DEEPSEEK_BASE_URL,
    apiKey: process.env.DEEPSEEK_API_KEY,
});

/**
 * Evaluates candidate's spoken intuition using GPT-4.
 * @param {string} candidateResponse - Transcribed candidate response.
 * @returns {Promise<string>} - GPT-4 evaluation feedback.
 */
async function analyzeIntuition(candidateResponse) {
  try {
    console.log("🤖 Sending candidate response to Deepseek for analysis...");
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
            role: "system",
            content: `You are an AI coding interviewer assessing problem-solving skills. Provide concise feedback on the correctness, confidence, and improvement areas of the candidate’s response.`,
        },
        {
          role: "user",
          content: `The question is to check if a string is a palindrome. Analyze the following candidate response: "${candidateResponse}". Assess correctness, confidence, and areas for improvement.
          - Is the intuition correct?
          - How confident is the response?
          - Provide suggestions if improvement is needed.
          - Response should be in a short, conversational format.`,
        },
      ],
      max_tokens: 100,
      temperature: 0,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ GPT-4 Analysis Error:", error.message);
    return "I couldn't process that. Could you clarify?";
  }
}

router.post("/", async (req, res) => {
    const { response } = req.body;
  
    if (!response) {
      return res.status(400).json({ error: "Missing candidate response" });
    }
  
    try {
      const feedback = await analyzeIntuition(response);
      res.status(200).json({ feedback });
    } catch (err) {
      res.status(500).json({ error: "Failed to analyze intuition", details: err.message });
    }
});

module.exports = router;

