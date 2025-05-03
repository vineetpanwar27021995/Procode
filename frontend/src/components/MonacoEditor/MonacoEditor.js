import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import api from "../../services/api";
import { LoaderCircle } from "lucide-react";
import { baseURL } from "../../utils/getBaseURL";
import { useAuthStore } from '../../stores/authStore';
import { useAnamStore } from '../../stores/anamStore';
import {useThemeStore} from '../../stores/themeStore'

import { extractFunctionName } from "../../utils/extractFunctionName";
import { wrapUserCode } from "../../utils/wrapUserCode";
import {getDifficultyBorderClass, getDifficultyClass, getBgColorClass} from "../../utils/UIHelper";
import { useUserStore } from "stores/userStore";
import { useSnackbarStore } from '../../stores/snackbarStore'; // Adjust path if needed

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
  categoryId,
  problemMetadata,
}) => {
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [functionName, setFunctionName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const monacoRef = useRef(null);
  const {fetchUserProfile} = useUserStore();
  const { showSnackbar } = useSnackbarStore();

  const darkMode = useThemeStore((state) => state.darkMode);
  console.log(`darkMode`, darkMode);

  useEffect(() => {
    if (starterCode) {
      setCode(starterCode);
      const name = extractFunctionName(language, starterCode);
      setFunctionName(name);
    }
  }, [starterCode, language]);

  useEffect(() => {
    const loadExistingCode = async () => {
      try {
        const user = useAuthStore.getState().user;
        if (!user || !problemId || !categoryId) return;
  
        const res = await api.post(`/submission/load`, {
          categoryId,
          questionId: problemId,
        });
  
        if (res.data?.code) {
          setCode(res.data.code);
        }
      } catch (err) {
        console.error("❌ Failed to load previous code:", err);
      }
    };
  
    loadExistingCode();
  }, [problemId, categoryId]);

  const runCode = async () => {
    console.log("Running code...", problemMetadata);
    const batchSubmissions = (problemMetadata.custom_test_cases || []).map((testCase) => ({
      source_code: wrapUserCode(code, language, functionName, testCase),
      language_id: LANGUAGE_MAP[language],
      stdin: testCase.endsWith("\n") ? testCase : testCase + "\n",
    }));

    const res = await api.post(`/judge/batch`, {
      problem_id: problemMetadata.id,
      problemMetadata,
      submissions: batchSubmissions,
    });
      return res;
  }

  const handleRun = async () => {
    if (!isUnlocked || !problemId || !problemMetadata) return;

    setLoading(true);
    setOutput("⏳ Judging...");

    try {
      // 🛠 Wrap code automatically
      
      const res = await runCode();
      const results = res.data?.results || [];

      console.log("Judge results:", results);

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

  const handleSubmit = async () => {
    try {
      const user = useAuthStore.getState().user;
      if (!user || !problemId || !categoryId) return;
      console.log("Submitting code...", user);
  
      setSubmitLoading(true);

      const res = await runCode();
      const results = res.data?.results || [];
      const formatted = results.map((r, i) => {
        const status = r.status?.description || "Unknown";
        const icon = status === "Accepted" ? "✅" : "❌";
        return `🧪 Test Case ${i + 1} — ${icon} ${status}`;
      }).join("\n");

      setOutput(formatted);

      const allPassed = results.every(r => r.status?.description === "Accepted");
      
      const conversationHistory = useAnamStore.getState().conversationHistory;
      
      const analysisRes = await api.post(`/submit`, {
        code,
        categoryId,
        questionId: problemId,
        codeDescription: problemMetadata.description,
        codeResults: results,
        messages: conversationHistory, // ✅ send full history
      });

      
      if (analysisRes.data.success) {
        console.log("Submission saved successfully! ✅", fetchUserProfile, typeof fetchUserProfile);
        fetchUserProfile();
        showSnackbar("Submission saved successfully! ✅", "success");

        console.log("Code submitted successfully! ✅");
        
      } else {
      showSnackbar("Submission saved, but no complexity feedback", "info");

        console.log("Submission saved, but no complexity feedback.");
      }
      if (allPassed) onSuccess?.();

    } catch (err) {
      showSnackbar("❌ Submission failed", "error");
      console.error("❌ Submission failed:", err);
    } finally {
      setSubmitLoading(false);
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
          className={`btn btn-success ml-auto !text-[#fff] ${getBgColorClass(problemMetadata.difficulty)}`}
          onClick={handleRun}
          disabled={!isUnlocked || loading}
        >
          {loading ? <LoaderCircle className="animate-spin" /> : "Run"}
        </button>
        <button
          className={`btn border  ${darkMode ? 'bg-black' : 'bg-white'} ${getDifficultyBorderClass(problemMetadata.difficulty)} ${ darkMode ? '!text-[#fff]' : getDifficultyClass(problemMetadata.difficulty)} ml-2 `}
          onClick={handleSubmit}
          disabled={!isUnlocked || submitLoading}
        >
         {submitLoading ? <LoaderCircle className="animate-spin" /> : "Submit"} 
        </button>
      </div>

      {/* Code Editor */}
      <div className={`flex-1 min-h-0 bg-base-100 rounded-box overflow-auto`}>
        <Editor
          height="100%"
          theme={darkMode ? "vs-dark" : "vs-light"}
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