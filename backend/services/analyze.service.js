const { OpenAI } = require('openai');
const readline = require('readline');

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

function extractJSONFromMarkdown(markdownString) {
  try {
    const cleaned = markdownString
      .replace(/^```json\s*/i, '')   // Remove ```json (case-insensitive)
      .replace(/```$/, '')           // Remove closing ```
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JSON:", err);
    return null;
  }
}

async function analyzeIntuition(candidateResponse, question) {
  console.log("Analyzing candidate response:", candidateResponse);
  try {
    const stream = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are an AI coding interviewer assessing problem-solving skills. Provide concise feedback on the correctness, confidence, and improvement areas of the candidate’s response.`,
        },
        {
          role: "user",
          content: `The question ${question.description}. Analyze the following candidate response: "${candidateResponse}". Assess correctness, confidence, and areas for improvement. Return an complete JSON object, no additional text with the following fields:
          - percentage,
          - confidence level,
          - skills,
          - brief,
          - hints (if incorrect or partially correct).`,
        },
      ],
      max_tokens: 300,
      temperature: 0,
      stream: true,
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullContent += content;
    }

    // Optionally parse and validate the JSON here
    const cleaned = fullContent.trim();

    // Try to parse the JSON
    let parsed;
    try {
      console.log('✅ Intuition analyzed and avatar triggered:', cleaned);
      parsed = extractJSONFromMarkdown(cleaned);
      console.log("Parsed JSON from markdown:", parsed, typeof parsed);
    } catch (parseError) {
      console.error("Failed to parse streamed JSON:", parseError);
      throw new Error("Failed to parse analysis response as JSON.");
    }

    console.log("Sanitized and parsed JSON:", parsed);
    return parsed;
  } catch (error) {
    console.error("Stream Analysis Error:", error);
    return "I couldn't process that. Could you clarify?";
  }
}

module.exports = { analyzeIntuition };