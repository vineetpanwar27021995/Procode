import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import api from "../../services/api"; // Adjust path
import { LoaderCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react"; // Added more icons
// import { baseURL } from "../../utils/getBaseURL"; // Assuming not used directly here
import { useAuthStore } from '../../stores/authStore'; // Adjust path
import { useAnamStore } from '../../stores/anamStore';   // Adjust path
import { useThemeStore } from '../../stores/themeStore'; // Adjust path

import { extractFunctionName } from "../../utils/extractFunctionName"; // Adjust path
import { wrapUserCode } from "../../utils/wrapUserCode";       // Adjust path
import { getDifficultyBorderClass, getDifficultyClass, getBgColorClass } from "../../utils/UIHelper"; // Adjust path
import { useUserStore } from "../../stores/userStore"; // Adjust path, ensure it's correctly named
import { useSnackbarStore } from '../../stores/snackbarStore'; // Adjust path

import styles from '../../styles/MonacoEditor.module.css'; // Create this CSS module

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71,
  cpp: 54,
};

const MonacoEditor = ({
  onSuccess,
  isUnlocked = true,
  starterCode = "",
  problemId,
  categoryId,
  problemMetadata, // Expects problemMetadata.custom_test_cases and problemMetadata.expected_outputs
}) => {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode[language]);
  // --- MODIFIED: Store full results and active test case ---
  const [testResults, setTestResults] = useState([]); // Array of result objects
  const [activeTestCaseIndex, setActiveTestCaseIndex] = useState(0);
  const [overallStatus, setOverallStatus] = useState({ text: "", type: "" }); // e.g., {text: "Accepted", type: "success"}
  const [runtime, setRuntime] = useState("");
  // --- END MODIFICATION ---
  const [functionName, setFunctionName] = useState(null);
  const [runLoading, setRunLoading] = useState(false); // Renamed from 'loading'
  const [submitLoading, setSubmitLoading] = useState(false);
  const monacoRef = useRef(null);
  const { fetchUserProfile } = useUserStore();
  const { showSnackbar } = useSnackbarStore();

  const darkMode = useThemeStore((state) => state.darkMode);

  useEffect(() => {
    if (starterCode[language]) {
      setCode(starterCode[language]);
      const name = extractFunctionName(language, starterCode[language]);
      setFunctionName(name);
    }
  }, [starterCode[language], language]);

  useEffect(() => {
    const loadExistingCode = async () => {
      try {
        const user = useAuthStore.getState().user;
        if (!user || !problemId || !categoryId) return;
        const res = await api.post(`/submission/load`, { categoryId, questionId: problemId });
        if (res.data?.code) {
          setCode(res.data.code);
        }
      } catch (err) {
        console.error("❌ Failed to load previous code:", err);
      }
    };
    if (isUnlocked) { // Only load if unlocked
        loadExistingCode();
    }
  }, [problemId, categoryId, isUnlocked]);


  const processRunResults = (results, isSubmit = false) => {
    if (!results || results.length === 0) {
        setTestResults([]);
        setOverallStatus({ text: "No results", type: "info" });
        setRuntime("");
        return false;
    }

    setTestResults(results);
    setActiveTestCaseIndex(0); // Default to first test case

    const allAccepted = results.every(r => r.status?.description === "Accepted");
    const firstFailed = results.find(r => r.status?.description !== "Accepted");
    const totalTime = results.reduce((acc, r) => acc + parseFloat(r.time || 0), 0);

    if (allAccepted) {
        setOverallStatus({ text: "Accepted", type: "success" });
        if (isSubmit) onSuccess?.();
    } else if (firstFailed) {
        setOverallStatus({ text: firstFailed.status?.description || "Error", type: "error" });
    } else {
        setOverallStatus({ text: "Unknown Status", type: "warning" });
    }
    setRuntime(`${totalTime.toFixed(2)} ms`); // Assuming time is in ms or adjust
    return allAccepted;
  };


  const runCodeInternal = async () => {
    // This function now only performs the API call
    const batchSubmissions = (problemMetadata?.custom_test_cases || []).map((testCaseInput, index) => ({
      source_code: wrapUserCode(code, language, functionName, testCaseInput), // Pass testCaseInput directly
      language_id: LANGUAGE_MAP[language],
      stdin: testCaseInput.endsWith("\n") ? testCaseInput : testCaseInput + "\n",
      // Include expected_output if your judge API uses it for comparison
      // expected_output: problemMetadata?.expected_outputs?.[index] || null,
    }));

    const res = await api.post(`/judge/batch`, {
      problem_id: problemId || problemMetadata?.id,
      problemMetadata, // Sending full metadata might be large, send only needed parts
      submissions: batchSubmissions,
    });
    return res.data?.results || []; // Return only the results array
  };


  const handleRun = async () => {
    if (!isUnlocked || !problemId || !problemMetadata) return;

    setRunLoading(true);
    setOverallStatus({ text: "⏳ Judging...", type: "info" });
    setTestResults([]); // Clear previous results

    try {
      const results = await runCodeInternal();
      console.log("Judge results:", results);
      processRunResults(results, false);
    } catch (err) {
      console.error("❌ Judge Error:", err);
      setOverallStatus({ text: "❌ Failed to judge. Please try again.", type: "error" });
      setTestResults([]);
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isUnlocked || !problemId || !categoryId || !problemMetadata) return;

    setSubmitLoading(true);
    setOverallStatus({ text: "⏳ Submitting & Judging...", type: "info" });
    setTestResults([]);

    try {
      const results = await runCodeInternal();
      console.log("Submission Judge results:", results);
      const allPassed = processRunResults(results, true); // Pass true for isSubmit

      const conversationHistory = useAnamStore.getState().conversationHistory;
      const analysisRes = await api.post(`/submit`, {
        code,
        categoryId,
        questionId: problemId,
        codeDescription: problemMetadata.description, // Ensure this is plain text
        codeResults: results, // Send raw results
        messages: conversationHistory,
      });

      if (analysisRes.data.success) {
        fetchUserProfile(); // Refresh user profile to get updated submissions
        showSnackbar("Submission saved successfully!", "success");
      } else {
        showSnackbar("Submission saved, but no complexity feedback.", "info");
      }
      // onSuccess is called within processRunResults if allPassed
    } catch (err) {
      showSnackbar("❌ Submission failed", "error");
      console.error("❌ Submission failed:", err);
      setOverallStatus({ text: "❌ Submission failed. Please try again.", type: "error" });
      setTestResults([]);
    } finally {
      setSubmitLoading(false);
    }
  };

  const currentTestCase = testResults[activeTestCaseIndex];
  const currentInput = problemMetadata?.custom_test_cases?.[activeTestCaseIndex] || "N/A";
  const currentExpectedOutput = problemMetadata?.expected_outputs?.[activeTestCaseIndex] || "N/A";


  return (
    <div className={`h-full flex flex-col space-y-2 overflow-hidden ${styles.monacoContainer}`}>
      {/* Header controls */}
      <div className={`flex justify-between items-center py-2 ${styles.controlsHeader}`}>
        <select
          className={`${styles.select} select select-bordered`}
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={!isUnlocked || runLoading || submitLoading}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
        <div className="flex items-center">
          <button
            className={`btn btn-md ml-auto mr-2 ${styles.runButton} ${getBgColorClass(problemMetadata?.difficulty)} text-white`}
            onClick={handleRun}
            disabled={!isUnlocked || runLoading || submitLoading}
          >
            {runLoading ? <LoaderCircle className="animate-spin" size={18}/> : "Run"}
          </button>
          <button
            className={`btn btn-md ${styles.submitButton} bg-transparent border ${getDifficultyBorderClass(problemMetadata?.difficulty)} ${ darkMode ? '!text-[#fff]' : getDifficultyClass(problemMetadata?.difficulty)}`}
            onClick={handleSubmit}
            disabled={!isUnlocked || submitLoading || runLoading}
          >
           {submitLoading ? <LoaderCircle className="animate-spin" size={18}/> : "Submit"}
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className={`flex-1 min-h-0 rounded-lg overflow-hidden ${styles.editorWrapper}`}>
        <Editor
          height="100%"
          theme={darkMode ? "vs-dark" : "light"} // Use "light" for non-dark themes
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
            automaticLayout: true,
          }}
        />
      </div>

      {/* --- MODIFIED: Output Panel --- */}
      <div className={`${styles.outputPanel} h-[35%] rounded-lg flex flex-col`}>
        {/* Header: Overall Status and Test Case Tabs */}
        <div className={styles.outputHeader}>
        <div className={styles.testCaseTabs}>
            {(testResults.length > 0 ? testResults : problemMetadata?.custom_test_cases || []).map((_, index) => (
              <button
                key={index}
                className={`${styles.tabButton} ${index === activeTestCaseIndex ? styles.tabActive : ''}`}
                onClick={() => setActiveTestCaseIndex(index)}
              >
                <span className={styles.tabDot} /> Case {index + 1}
              </button>
            ))}
          </div>
          <div className={styles.overallStatus}>
            {overallStatus.type === "success" && <CheckCircle size={20} className={styles.statusIconSuccess} />}
            {overallStatus.type === "error" && <XCircle size={20} className={styles.statusIconError} />}
            {overallStatus.type === "warning" && <AlertTriangle size={20} className={styles.statusIconWarning} />}
            <span className={`${styles.statusText} ${styles[overallStatus.type]}`}>
              {overallStatus.text}
            </span>
            {/* {runtime && <span className={styles.runtimeText}>Runtime: {runtime}</span>} */}
          </div>
          
        </div>

        {/* Test Case Details */}
        {testResults.length > 0 && currentTestCase ? (
          <div className={styles.testCaseDetails}>
            <div className={styles.detailBlock}>
              <h5 className={styles.detailTitle}>Input</h5>
              <pre className={styles.detailContent}>{currentInput}</pre>
            </div>
            <div className={styles.detailBlock}>
              <h5 className={styles.detailTitle}>Output</h5>
              <pre className={styles.detailContent}>{currentTestCase.stdout || currentTestCase.stderr || "N/A"}</pre>
            </div>
            <div className={styles.detailBlock}>
              <h5 className={styles.detailTitle}>Expected</h5>
              <pre className={styles.detailContent}>{currentExpectedOutput}</pre>
            </div>
          </div>
        ) : (
          <div className={styles.noOutput}>
            {runLoading || submitLoading ? "Judging..." : (testResults.length === 0 && overallStatus.text && overallStatus.text !== "⏳ Judging..." ? "Run code to see results." : "Run code to see results.")}
          </div>
        )}
      </div>
      {/* --- END MODIFICATION --- */}
    </div>
  );
};

export default MonacoEditor;
