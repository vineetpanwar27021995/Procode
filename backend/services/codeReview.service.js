const { OpenAI } = require('openai');

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/**
 * Cleans and parses streamed Markdown JSON from LLM response
 */
function extractJSONFromMarkdown(markdownString) {
  try {
    const cleaned = markdownString
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ Failed to parse JSON from stream:", err);
    return null;
  }
}

/**
 * DeepSeek service to get time complexity, space complexity, and conversation summary in one shot.
 */
async function analyzeCodeAndConversation({ code, codeDescription, messages }) {
  try {
    const userPrompt = `
Analyze the following JavaScript function and provide:
- Time Complexity (Big O)
- Space Complexity (Big O)

Then summarize this technical discussion between the candidate and interviewer in 2–3 lines.

Return a complete JSON object like this (inside triple backticks):
\`\`\`json
{
  "time": "O(n)",
  "space": "O(1)",
  "summary": "User approached problem using a brute-force technique initially but then pivoted to a hashmap-based solution with guidance from the interviewer."
}
\`\`\`

Code:
${code}

Code Description:
${codeDescription}

Conversation:
${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}
`;

    const stream = await openai.chat.completions.create({
      model: "deepseek-chat",
      stream: true,
      temperature: 0,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "You are a senior software engineer summarizing a candidate’s code and AI conversation.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    let fullContent = "";

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullContent += content;
    }

    const parsed = extractJSONFromMarkdown(fullContent);
    if (!parsed) throw new Error("Unable to parse JSON from DeepSeek stream");
    return parsed;

  } catch (error) {
    console.error("❌ DeepSeek analysis failed:", error);
    throw error;
  }
}

module.exports = {
  analyzeCodeAndConversation,
};