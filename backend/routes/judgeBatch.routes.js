const express = require("express");
const axios = require("axios");
const router = express.Router();
const pollJudge0Result = require("../utils/pollJudge0Result");

const deepseekCache = {}; // 🧠 Simple server memory cache

// 🔥 Function to fetch expected outputs from DeepSeek
const getExpectedOutputsFromDeepSeek = async (problemDescription, problemKey) => {
  if (deepseekCache[problemKey]) {
    console.log("✅ Using cached DeepSeek outputs for", problemKey);
    return deepseekCache[problemKey];
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "Extract only the expected outputs for test cases as a JSON array. Output only JSON, no extra text.",
          },
          {
            role: "user",
            content: `Here is the coding problem description:\n\n${problemDescription}`,
          },
        ],
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let text = response.data.choices?.[0]?.message?.content || "[]";
    console.log("🧠 DeepSeek raw response:", text);

    // Handle if DeepSeek wraps inside ```json ... ``` blocks
    text = text.replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text); // 🧠 Now safe to parse
    console.log("🧠 DeepSeek parsed response:", parsed);
    deepseekCache[problemKey] = parsed; // Save to cache
    return parsed;
  } catch (err) {
    console.error("❌ DeepSeek API error:", err.message);
    return [];
  }
};

// 🎯 Batch judge endpoint
router.post("/judge/batch", async (req, res) => {
  const { problem_id, problem_description, submissions } = req.body;

  if (!problem_id || !problem_description || !Array.isArray(submissions)) {
    return res.status(400).json({ error: "Missing problem_id, problem_description or submissions array." });
  }

  try {
    const expectedOutputs = await getExpectedOutputsFromDeepSeek(problem_description, problem_id);
    console.log("🚀 Expected outputs:", expectedOutputs);

    // 1. Submit to Judge0 batch API
    console.log("🚀 submissions", submissions);

    const batchPayload = { submissions };
    const batchRes = await axios.post(
      "https://judge0-ce.p.rapidapi.com/submissions/batch?base64_encoded=false&wait=true",
      batchPayload,
      {
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    );

    const tokens = batchRes.data; // [{ token }, { token }]
    console.log("🛜 Tokens received:", tokens);

    // 2. Poll all token results
    const finalResults = [];
    for (const item of tokens) {
      const result = await pollJudge0Result(item.token);
      finalResults.push(result);
    }

    console.log("✅ Final Judge0 Results:", finalResults);

    const judgedResults = finalResults.map((submission, index) => {
        const expectedRaw = expectedOutputs[index];
        const expected = expectedRaw ?? "";
        const userOutput = (submission.stdout || "").toString().trim();
      
        console.log('vineet compare1', typeof expectedRaw, typeof submission);
        console.log('vineet compare2', expected, userOutput);
        console.log('vineet compare2.5', typeof expected, typeof userOutput);
      
        let passed = false;
      
        if (Array.isArray(expected)) {
          try {
            const parsedUserOutput = JSON.parse(userOutput);
            if (Array.isArray(parsedUserOutput)) {
              passed = expected.length === parsedUserOutput.length &&
                expected.every((val, idx) => val === parsedUserOutput[idx]);
            }
          } catch (err) {
            console.log('vineet parse error', err);
            passed = false;
          }
        } else {
          passed = expected.toString().trim() === userOutput;
        }
      
        console.log('vineet compare3', passed);
      
        return {
          stdout: submission.stdout,
          stderr: submission.stderr,
          compile_output: submission.compile_output,
          status: {
            id: submission.status?.id,
            description: passed ? 'Accepted' : 'Rejected',
          },
          last_executed_test_case: {
            input: submissions[index]?.stdin || "",
            expected_output: expected,
            user_output: userOutput,
            passed,
          },
        };
    });

    return res.json({ results: judgedResults });
  } catch (err) {
    console.error("❌ Judge batch error:", err.message);
    return res.status(500).json({ error: "Batch judge failed", details: err.message });
  }
});

module.exports = router;