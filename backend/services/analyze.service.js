const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

async function analyzeIntuition(candidateResponse) {
  try {
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
    console.error("Analysis Error:", error);
    return "I couldn't process that. Could you clarify?";
  }
}

module.exports = { analyzeIntuition };