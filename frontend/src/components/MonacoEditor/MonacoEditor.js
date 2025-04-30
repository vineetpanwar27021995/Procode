import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { LoaderCircle } from "lucide-react";
import { baseURL } from "../../utils/getBaseURL";

import { extractFunctionName } from "../../utils/extractFunctionName";
import { wrapUserCode } from "../../utils/wrapUserCode";

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

const MonacoEditor = ({
  onSuccess,
  isUnlocked = false,
  starterCode = "",
  problemId,
  problemMetadata,
}) => {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [functionName, setFunctionName] = useState(null);
  const [loading, setLoading] = useState(false);
  const monacoRef = useRef(null);

  useEffect(() => {
    if (starterCode) {
      setCode(starterCode);
      const name = extractFunctionName(language, starterCode);
      setFunctionName(name);
    }
  }, [starterCode, language]);

  const handleRun = async () => {
    if (!isUnlocked || !problemId || !problemMetadata) return;

    setLoading(true);
    setOutput("⏳ Judging...");

    try {
      // 🛠 Wrap code automatically
      const finalCode = wrapUserCode(code, language, functionName, problemMetadata.custom_test_cases);

      const batchSubmissions = (problemMetadata.custom_test_cases || []).map(testCase => ({
        source_code: finalCode,
        language_id: LANGUAGE_MAP[language],
        stdin: testCase.endsWith("\n") ? testCase : testCase + "\n",
      }));

      const res = await axios.post(`${baseURL}/api/judge/batch`, {
        problem_id: problemMetadata.id,
        problem_description: problemMetadata.description,
        submissions: batchSubmissions,
      });

      const results = res.data?.results || [];

      const formatted = results.map((r, i) => {
        const status = r.status?.description || "Unknown";
        const icon = status === "Accepted" ? "✅" : "❌";
        return `🧪 Test Case ${i + 1} — ${icon} ${status}`;
      }).join("\n");

      setOutput(formatted);

      const allPassed = results.every(r => r.status?.description === "Accepted");
      if (allPassed) onSuccess?.();

    } catch (err) {
      console.error("❌ Judge Error:", err);
      setOutput("❌ Failed to judge your code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-2 overflow-hidden">
      {/* Header controls */}
      <div className="flex justify-between items-center mb-2">
        <select
          className="select select-bordered"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={!isUnlocked}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
        <button
          className="btn btn-success"
          onClick={handleRun}
          disabled={!isUnlocked || loading}
        >
          {loading ? <LoaderCircle className="animate-spin" /> : "Run"}
        </button>
      </div>

      {/* Code Editor */}
      <div className="flex-1 min-h-0 bg-base-100 rounded-box overflow-auto">
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={code}
          onChange={(val) => setCode(val || "")}
          onMount={(editor) => (monacoRef.current = editor)}
          options={{
            readOnly: !isUnlocked,
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
          }}
        />
      </div>

      {/* Output Panel */}
      <div className="h-[30%] bg-base-100 p-4 rounded-box flex flex-col space-y-2 overflow-hidden">
        <h4 className="font-semibold">Output</h4>
        <pre className="bg-neutral text-neutral-content p-3 rounded h-full overflow-y-auto whitespace-pre-wrap text-sm">
          {output}
        </pre>
      </div>
    </div>
  );
};

export default MonacoEditor;