// services/analyze.service.js
const { OpenAI } = require('openai');
// const readline = require('readline'); // Not needed for streaming to client

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

function extractJSONFromMarkdown(markdownString) {
  try {
    const cleaned = markdownString
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Failed to parse JSON from markdown:", err, "String:", markdownString);
    return null; // Return null if parsing fails
  }
}

/**
 * Analyzes candidate's intuition using DeepSeek and streams text chunks back via WebSocket.
 * After streaming text, sends a final structured JSON feedback.
 * @param {Array<object>} messageHistory - The conversation history.
 * @param {object} question - The problem metadata.
 * @param {WebSocket} ws - The WebSocket connection to the client.
 */
async function analyzeIntuitionStream(messageHistory, question, ws) {
  const candidateResponse = messageHistory
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' '); // Consolidate user responses

  console.log("Analyzing candidate response (stream):", candidateResponse);
  let fullLLMTextResponse = ""; // To accumulate text for final JSON parsing

  try {
    
    // const stream = await openai.chat.completions.create({
    //   model: "deepseek-chat",
    //   messages: [
    //     {
    //       role: "system",
    //       content: `You are an AI coding interviewer. First, provide a conversational, thinking-aloud style response to the candidate's approach. Then, after your conversational response, on a new line, provide a structured JSON object. The conversational response should assess correctness, confidence, and improvement areas. The JSON should contain:
    //       - percentage (number): Estimated correctness/viability (0-100).
    //       - confidence (string): e.g., "High", "Medium", "Low".
    //       - skills (array of strings): e.g., ["Problem Decomposition", "Algorithm Selection"].
    //       - brief (string): A very short summary of the feedback.
    //       - hints (array of strings, if incorrect/partially correct, 3 hints).
    //       Example JSON: {"percentage": 75, "confidence": "Medium", "skills": ["Algorithm Selection"], "brief": "Good start, consider edge cases.", "hints": ["Hint 1...", "Hint 2...", "Hint 3..."]}`,
    //     },
    //     {
    //       role: "user",
    //       content: `The question is: "${question.name}". Problem Description: "${question.short_description || question.description.substring(0, 200)}". Analyze my approach: "${candidateResponse}". Provide your conversational feedback first, then the structured JSON object on a new line.`,
    //     },
    //   ],
    //   max_tokens: 500, // Adjust as needed
    //   temperature: 0.3, // Adjust for desired creativity/determinism
    //   stream: true,
    // });

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

    let accumulatedTextForTTS = "";
    let jsonBuffer = "";
    let inJsonBlock = false;

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullLLMTextResponse += content; // Accumulate full response for final JSON parsing

      // Simple way to detect start of JSON block
      if (content.includes('{') && !inJsonBlock) {
        // If we were streaming text before JSON, send the last bit
        if (accumulatedTextForTTS && extractJSONFromMarkdown(accumulatedTextForTTS)?.trim()?.length) {
           console.log('Streaming final text chunk before JSON:', accumulatedTextForTTS);
           ws.send(JSON.stringify({ type: 'LLM_CHUNK', payload: { chunk: extractJSONFromMarkdown(accumulatedTextForTTS)?.trim(), isFinalTTSChunk: true } }));
           accumulatedTextForTTS = ""; // Reset for JSON
        }
        inJsonBlock = true;
      }

      if (inJsonBlock) {
        jsonBuffer += content;
      } else {
        accumulatedTextForTTS += content;
        // Stream conversational text chunks
        // Send chunks more frequently for better real-time feel, e.g., on sentence boundaries or fixed length
        if (accumulatedTextForTTS.includes('.') || accumulatedTextForTTS.includes('?') || accumulatedTextForTTS.includes('!') || accumulatedTextForTTS.length > 50) {
           console.log('Streaming text chunk:', accumulatedTextForTTS);
           ws.send(JSON.stringify({ type: 'LLM_CHUNK', payload: { chunk: extractJSONFromMarkdown(accumulatedTextForTTS)?.trim(), isFinalTTSChunk: false } }));
           accumulatedTextForTTS = ""; // Reset buffer
        }
      }
    }

    // Send any remaining conversational text
    if (accumulatedTextForTTS.trim() && !inJsonBlock) { // Ensure we weren't cut off mid-JSON
        console.log('Streaming final remaining text chunk:', accumulatedTextForTTS);
        ws.send(JSON.stringify({ type: 'LLM_CHUNK', payload: { chunk: accumulatedTextForTTS, isFinalTTSChunk: true } }));
    }

    console.log("Full LLM Response for parsing:", fullLLMTextResponse);
    // Attempt to parse the structured JSON from the full response
    // The JSON might be at the end of fullLLMTextResponse
    const jsonMatch = fullLLMTextResponse.match(/(\{[\s\S]*\})/);
    let feedbackData = null;
    if (jsonMatch && jsonMatch[0]) {
        feedbackData = extractJSONFromMarkdown(jsonMatch[0]);
    } else if (jsonBuffer.trim()) { // Fallback to jsonBuffer if explicit match failed
        feedbackData = extractJSONFromMarkdown(jsonBuffer);
    }


    if (feedbackData) {
      console.log('✅ LLM Analysis Complete. Parsed Feedback:', feedbackData);
      ws.send(JSON.stringify({ type: 'ANALYSIS_COMPLETE', payload: feedbackData }));
    } else {
      console.error('❌ Failed to parse structured JSON feedback from LLM response.');
      console.error('Full LLM text was:', fullLLMTextResponse);
      ws.send(JSON.stringify({ type: 'ERROR', payload: 'Failed to parse analysis from AI.' }));
    }

  } catch (error) {
    console.error("Stream Analysis Service Error:", error);
    ws.send(JSON.stringify({ type: 'ERROR', payload: "I couldn't process that. Could you clarify?" }));
  } finally {
    // Signal that the entire LLM stream (including structured data) has ended
    ws.send(JSON.stringify({ type: 'LLM_STREAM_END' }));
    console.log("LLM Stream processing finished for this request.");
  }
}

module.exports = { analyzeIntuitionStream }; // Renamed
