import React, { useEffect, useRef, useState } from "react";
import { useParams } from 'react-router-dom';
import { MonacoEditor, AITile, ProblemView } from '../../components'; // Adjust path if needed
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { baseURL } from '../../utils/getBaseURL'; // Adjust path
import { useAnamStore } from '../../stores/anamStore'; // Adjust path
import Loader from '../../components/Loader/Loader'; // Adjust path
import { ErrorBoundary } from "react-error-boundary";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"; // Removed get...Element functions

import styles from '../../styles/CodingSession.module.css'; // Import CSS module
import { useThemeStore } from "../../stores/themeStore"; // Import theme store

const CodingSession = () => {
  const { questionId, categoryId } = useParams();
  const [problem, setProblem] = useState(null);
  const [intuitionApproved, setIntuitionApproved] = useState(false); // Default to true to show editor
  const [testPassed, setTestPassed] = useState(false);
  const { width, height } = useWindowSize();
  const isMobile = width < 768;
  const hasFetchedRef = useRef(false); // To prevent multiple fetches
  const clearConversationHistory = useAnamStore((state) => state.clearConversationHistory);
  const darkMode = useThemeStore((state) => state.darkMode); // Get darkMode state

  // Refs for panel elements are no longer needed with direct Panel components
  // const refs = useRef();
  // useEffect(() => { ... refs.current = { ... } ... }, []);

  useEffect(() => {
    const fetchProblem = async () => {
      if (hasFetchedRef.current) return; // Prevent re-fetch
      hasFetchedRef.current = true; // Mark as fetched

      try {
        console.log(`Fetching problem: ${questionId} in category: ${categoryId}`);
        const res = await fetch(`${baseURL}/api/problem-metadata`, { // Ensure baseURL is correct
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: questionId, categoryId }), // Send categoryId if backend uses it
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Failed to parse error response" }));
            throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
  
        const data = await res.json();
        if (data.problem) {
            setProblem(data.problem);
        } else {
            throw new Error("Problem data not found in response.");
        }
        clearConversationHistory(); // Clear previous AI chat
      } catch (err) {
        console.error("❌ Failed to fetch problem:", err);
        setProblem(null); // Set problem to null on error to show loader/error message
      }
    };

    if (questionId && categoryId) {
      fetchProblem();
    }
    // Cleanup ref on unmount
    return () => { hasFetchedRef.current = false; };
  }, [questionId, categoryId, clearConversationHistory]); // Dependencies

  const handleTestSuccess = () => {
    setTestPassed(true);
    setTimeout(() => setTestPassed(false), 4000); // Confetti duration
  };

  // Error Fallback for ErrorBoundary
  const ErrorFallback = ({ error }) => (
    <div className={styles.errorFallback} role="alert">
      <h2>Something went wrong:</h2>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button onClick={() => window.location.reload()} className={styles.errorButton}>Try Again</button>
    </div>
  );

  if (!problem) {
    return <Loader message='Hang up tight! Fetching problem details...' />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={`${styles.codingSessionContainer} ${darkMode ? 'dark' : 'light'}`}>
        {testPassed && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

        {isMobile ? (
          // 🔹 MOBILE VIEW
          <div className={styles.mobileViewContainer}>
            <div className={styles.mobileProblemViewPanel}>
              <ProblemView problem={problem} categoryId={categoryId}/>
            </div>

            <div className={styles.mobileEditorPanel}>
              {!intuitionApproved ? (
                <div className={styles.aiTilePlaceholder}>
                  {/* Replace with AITile component when ready */}
                  <p>AI Tile / Intuition will be here.</p>
                  <AITile fullScreen setIntuitionApproved={setIntuitionApproved} intuitionApproved={intuitionApproved} problemMetadata={problem}/>
                </div>
              ) : (
                <MonacoEditor
                  isUnlocked={intuitionApproved}
                  onSuccess={handleTestSuccess}
                  problemId={questionId}
                  // Ensure starterCode is accessed correctly based on language
                  starterCode={problem.starterCode?.javascript || problem.starterCode?.python || problem.starterCode?.cpp || ""}
                  problemMetadata={problem}
                  categoryId={categoryId}
                />
              )}
            </div>
          </div>
        ) : (
          // 🔹 DESKTOP VIEW
          <PanelGroup direction="horizontal" id="group" className={styles.desktopPanelGroup}>
            <Panel defaultSize={45} minSize={25} id="left-panel" className={styles.desktopLeftPanel}>
              <div className={styles.desktopLeftPanelContent}>
              {/* { !intuitionApproved ? (
                <div className={styles.desktopProblemViewWrapper}>
                  <ProblemView problem={problem} categoryId={categoryId}/>
                </div>
              ) : ( */}
                <PanelGroup direction="vertical" id="problem-group" >
                <Panel defaultSize={55} minSize={25} id="top-problem-panel" className={styles.problemTopView}>
                  <div className={`${styles.desktopProblemViewWrapper} ${styles.desktopProblemViewWrapperIntuitionHidden}`}>
                    <ProblemView problem={problem} categoryId={categoryId}/>
                  </div>
                  </Panel>
                  <PanelResizeHandle id="resize-problem-handle" className={styles.resizeProblemHandle} />
                  <Panel defaultSize={45} minSize={25} id="bottom-problem-panel" className={styles.problemBottomView}>
                  <div className={styles.desktopAITileWrapper}>
                     {/* Replace with AITile component when ready */}
                    <AITile fullScreen setIntuitionApproved={setIntuitionApproved} intuitionApproved={intuitionApproved} problemMetadata={problem}/>
                  </div>
                  </Panel>
                </PanelGroup>
              {/* )} */}
            </div>
            </Panel>

            <PanelResizeHandle id="resize-handle" className={styles.resizeHandle} />

            <Panel defaultSize={55} minSize={30} id="right-panel" className={styles.desktopRightPanel}> {/* MinSize adjusted */}
              <div className={styles.desktopEditorWrapper}>
                <MonacoEditor
                  // className="h-full" // MonacoEditor should fill its wrapper
                  isUnlocked={intuitionApproved}
                  onSuccess={handleTestSuccess}
                  problemId={questionId}
                  customTestCases={problem.custom_test_cases || []}
                  starterCode={problem.starterCode}
                  problemMetadata={problem}
                  categoryId={categoryId}
                />
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default CodingSession;
