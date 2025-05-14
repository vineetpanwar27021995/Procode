import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from 'react-router-dom';
import { MonacoEditor, ProblemView } from '../../components'; // Adjust path
import AITile from '../../components/AITile/AITile'; // Assuming AITile is here
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { baseURL } from '../../utils/getBaseURL';
import { useAnamStore } from '../../stores/anamStore';
import Loader from '../../components/Loader/Loader';
import { ErrorBoundary } from "react-error-boundary";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import styles from '../../styles/CodingSession.module.css';
import { useThemeStore } from "../../stores/themeStore";

// Ensure this matches your backend server and WebSocket path
const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:8080'; // Define globally or pass from env

const CodingSession = () => {
  const { questionId, categoryId } = useParams();
  const [problem, setProblem] = useState(null);
  const [intuitionApproved, setIntuitionApproved] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const { width, height } = useWindowSize();
  const isMobile = width < 768;
  const hasFetchedRef = useRef(false);
  const clearConversationHistory = useAnamStore((state) => state.clearConversationHistory);
  const darkMode = useThemeStore((state) => state.darkMode);

  // WebSocket related state
  const wsRef = useRef(null);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const [webSocketError, setWebSocketError] = useState(null);
  const [lastMessageFromAI, setLastMessageFromAI] = useState(null); // To pass to AITile

  useEffect(() => {
    // Fetch problem data
    const fetchProblem = async () => {
      if (hasFetchedRef.current && problem?.id === questionId) return;
      hasFetchedRef.current = true;

      try {
        console.log(`Fetching problem: ${questionId} in category: ${categoryId}`);
        const res = await fetch(`${baseURL}/api/problem-metadata`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ problemId: questionId, categoryId }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Failed to parse error response" }));
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
  
        const data = await res.json();
        if (data.problem) {
          setProblem(data.problem);
          // Reset states for new problem
          setIntuitionApproved(false);
          setTestPassed(false);
          setLastMessageFromAI(null); // Clear previous AI messages
          setWebSocketError(null); // Clear previous WS errors
        } else {
          throw new Error("Problem data not found in response.");
        }
        clearConversationHistory();
      } catch (err) {
        console.error("❌ Failed to fetch problem:", err);
        setProblem(null);
        setWebSocketError(`Failed to load problem: ${err.message}`);
      }
    };

    if (questionId && categoryId) {
      fetchProblem();
    }
    return () => { hasFetchedRef.current = false; };
  }, [questionId, categoryId, clearConversationHistory, problem?.id]);

  // Effect for WebSocket connection management
  useEffect(() => {
    if (!problem?.id || intuitionApproved) { // Only connect if there's a problem and intuition isn't approved yet
        if (wsRef.current) {
            console.log("Closing WebSocket connection because problem changed or intuition approved.");
            wsRef.current.close(1000, "Problem changed or intuition approved");
            wsRef.current = null;
            setIsWebSocketReady(false);
        }
        return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("WebSocket already open for problem:", problem.id);
        return; // Already connected
    }

    console.log("Attempting to connect to WebSocket at:", WEBSOCKET_URL, "for problem:", problem.id);
    const ws = new WebSocket(WEBSOCKET_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket (CodingSession): ✅ Connection Opened");
      setIsWebSocketReady(true);
      setWebSocketError(null);
    };

    ws.onmessage = (event) => {
      console.log("WebSocket (CodingSession): Message received:", event.data.substring(0, 100) + "...");
      try {
        const data = JSON.parse(event.data);
        // Pass the entire message object to AITile for it to handle different types
        setLastMessageFromAI({ type: data.type, payload: data.payload, id: Date.now() + Math.random().toString(36).substring(2,15) });
      } catch (e) {
        console.error("WebSocket (CodingSession): Error parsing message:", e);
        setWebSocketError("Error parsing message from AI assistant.");
        setLastMessageFromAI({ type: 'ERROR', payload: { message: "Error parsing message from AI." }, id: Date.now() });
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket (CodingSession): ❌ Error:", error);
      setWebSocketError("WebSocket connection error. Please try refreshing.");
      setIsWebSocketReady(false);
      // wsRef.current = null; // No, keep ref for potential retries or to avoid race conditions on close
    };

    ws.onclose = (event) => {
      console.log("WebSocket (CodingSession): 🔌 Connection Closed. Code:", event.code, "Reason:", event.reason, "Was clean:", event.wasClean);
      setIsWebSocketReady(false);
      // Only set error if it wasn't a clean/intended close
      if (event.code !== 1000 && event.code !== 1005 && !intuitionApproved) { // 1000=Normal, 1005=No status
        // setWebSocketError(prevError => prevError || `WebSocket connection closed (Code: ${event.code}).`);
      }
      // wsRef.current = null; // Important: Nullify ref on close to allow re-connection by this effect
    };

    return () => {
      if (wsRef.current) {
        console.log("Closing WebSocket connection on CodingSession cleanup or re-run for problem:", problem.id);
        wsRef.current.close(1000, "Component unmounting or problem changing");
        wsRef.current = null; // Ensure it's nullified
      }
      setIsWebSocketReady(false); // Reset readiness
    };
  }, [problem?.id, intuitionApproved]); // Re-run if problem.id changes or intuitionApproved status changes

  const sendToWebSocket = useCallback((dataToSend) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("CodingSession: Sending to WebSocket:", dataToSend.type);
      try {
        wsRef.current.send(JSON.stringify(dataToSend));
        setWebSocketError(null); // Clear previous send errors
      } catch (error) {
        console.error("CodingSession: Error sending to WebSocket:", error);
        setWebSocketError("Failed to send message to AI assistant.");
      }
    } else {
      console.error("CodingSession: WebSocket not open or not available. Cannot send.");
      setWebSocketError("AI assistant is not connected. Please wait or refresh.");
    }
  }, []); // wsRef is a ref, its current value doesn't need to be a dependency for useCallback


  const handleTestSuccess = () => {
    setTestPassed(true);
    setTimeout(() => setTestPassed(false), 4000);
  };

  const handleSetIntuitionApproved = useCallback((approved) => {
    setIntuitionApproved(approved);
    if (approved && wsRef.current) {
        console.log("Intuition approved, closing WebSocket from CodingSession.");
        wsRef.current.close(1000, "Intuition approved");
        wsRef.current = null;
        setIsWebSocketReady(false);
    }
  }, []);


  const ErrorFallback = ({ error }) => (
    <div className={styles.errorFallback} role="alert">
      <h2>Something went wrong:</h2>
      <pre style={{ color: "red" }}>{error.message}</pre>
      <button onClick={() => window.location.reload()} className={styles.errorButton}>Try Again</button>
    </div>
  );

  if (!problem && !webSocketError) { // Show loader if problem is null AND no initial WS error
    return <Loader message='Hang up tight! Fetching problem details...' />;
  }
  if (!problem && webSocketError) { // Show error if problem failed to load
     return <ErrorFallback error={{message: webSocketError || "Failed to load problem details."}} />
  }


  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className={`${styles.codingSessionContainer} ${darkMode ? 'dark' : 'light'}`}>
        {testPassed && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

        {isMobile ? (
          <div className={styles.mobileViewContainer}>
            <div className={styles.mobileProblemViewPanel}>
              <ProblemView problem={problem} categoryId={categoryId}/>
            </div>
            <div className={styles.mobileEditorPanel}>
              {!intuitionApproved ? (
                <AITile
                  fullScreen
                  setIntuitionApproved={handleSetIntuitionApproved}
                  intuitionApproved={intuitionApproved}
                  problemMetadata={problem}
                  // WebSocket related props
                  isWebSocketReady={isWebSocketReady}
                  onSendToWebSocket={sendToWebSocket}
                  receivedWebSocketMessage={lastMessageFromAI}
                  webSocketGlobalError={webSocketError} // Pass global WS errors
                />
              ) : (
                <MonacoEditor
                  isUnlocked={intuitionApproved}
                  onSuccess={handleTestSuccess}
                  problemId={questionId}
                  starterCode={problem.starterCode?.javascript || problem.starterCode?.python || problem.starterCode?.cpp || ""}
                  problemMetadata={problem}
                  categoryId={categoryId}
                />
              )}
            </div>
          </div>
        ) : (
          <PanelGroup direction="horizontal" id="group" className={styles.desktopPanelGroup}>
            <Panel defaultSize={45} minSize={25} id="left-panel" className={styles.desktopLeftPanel}>
              <PanelGroup direction="vertical" id="problem-group" >
                <Panel defaultSize={55} minSize={25} id="top-problem-panel" className={styles.problemTopView}>
                  <div className={`${styles.desktopProblemViewWrapper} ${styles.desktopProblemViewWrapperIntuitionHidden}`}>
                    <ProblemView problem={problem} categoryId={categoryId}/>
                  </div>
                </Panel>
                <PanelResizeHandle id="resize-problem-handle" className={styles.resizeProblemHandle} />
                <Panel defaultSize={45} minSize={25} id="bottom-problem-panel" className={styles.problemBottomView}>
                  <div className={styles.desktopAITileWrapper}>
                    {!intuitionApproved ? (
                        <AITile
                            fullScreen // Or false depending on desired layout
                            setIntuitionApproved={handleSetIntuitionApproved}
                            intuitionApproved={intuitionApproved}
                            problemMetadata={problem}
                            // WebSocket related props
                            isWebSocketReady={isWebSocketReady}
                            onSendToWebSocket={sendToWebSocket}
                            receivedWebSocketMessage={lastMessageFromAI}
                            webSocketGlobalError={webSocketError}
                        />
                    ) : (
                        <div className={styles.intuitionApprovedMessage}>
                            <p>Great! Your intuition was approved.</p>
                            <p>Proceed to the editor to implement your solution.</p>
                        </div>
                    )}
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>
            <PanelResizeHandle id="resize-handle" className={styles.resizeHandle} />
            <Panel defaultSize={55} minSize={30} id="right-panel" className={styles.desktopRightPanel}>
              <div className={styles.desktopEditorWrapper}>
                <MonacoEditor
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