import React, { useEffect, useRef, useState } from "react";
import { AnamEvent } from "@anam-ai/js-sdk/dist/module/types";
import { getPersonaResponse } from "../../utils/AnalyzeIntution"; // Adjust path
import { createClient } from '@anam-ai/js-sdk';
import useAnamSessionToken from '../../hooks/useAnamSessionToken'; // Adjust path
import { useAnamStore } from '../../stores/anamStore'; // Adjust path
import { getDifficultyClass, getDifficultyBorderClass } from "../../utils/UIHelper"; // Adjust path
import { useUserStore } from '../../stores/userStore'; // Adjust path
import styles from '../../styles/AITile.module.css'; // Import CSS module

const PERSONA_ID = process.env.REACT_APP_ANAM_PERSONA_ID; // Make sure this is correctly picked up

const AITile = ({ fullScreen = false, setIntuitionApproved, intuitionApproved, problemMetadata }) => {
  // Log PERSONA_ID at component mount for debugging
  useEffect(() => {
    if (!PERSONA_ID) {
        console.error("AITile FATAL ERROR: REACT_APP_ANAM_PERSONA_ID is not set or not accessible. AI Tile will not function.");
        setAnamConnectionError("AI Assistant not configured (Persona ID missing).");
    } else {
        console.log("AITile: PERSONA_ID found:", PERSONA_ID);
    }
  }, []);

  const { sessionToken, refreshSessionToken, loading: tokenLoading, error: tokenError } = useAnamSessionToken();
  const setConversationHistory = useAnamStore((state) => state.setConversationHistory);
  const userProfile = useUserStore((state) => state.userProfile);

  const anamClientRef = useRef(null);
  const initAttemptedForProblemRef = useRef(null); // Track init attempt per problem ID

  const [videoLoading, setVideoLoading] = useState(true);
  const abortControllerRef = useRef(null);

  const [personaDisplayText, setPersonaDisplayText] = useState("Initializing AI Assistant...");
  const [isPersonaSpeaking, setIsPersonaSpeaking] = useState(false);
  const [isLLMProcessing, setIsLLMProcessing] = useState(false);
  const [anamConnectionError, setAnamConnectionError] = useState(null);
  const [isAnamReady, setIsAnamReady] = useState(false);

  const speakAndDisplay = async (textToSpeak, isThinkingAck = false) => {
    if (!anamClientRef.current) {
      console.warn("Anam client not ready, cannot speak.", { isAnamReady, clientExists: !!anamClientRef.current });
      setPersonaDisplayText("AI assistant is not ready to speak.");
      return;
    }
    setPersonaDisplayText(textToSpeak);
    if (!isThinkingAck) setIsLLMProcessing(false);
    try {
      setIsPersonaSpeaking(true);
      anamClientRef.current.muteInputAudio();
      await anamClientRef.current.talk(textToSpeak);
    } catch (error) {
      console.error("Anam talk error:", error);
      setPersonaDisplayText("Sorry, I had trouble speaking.");
    } finally {
      setIsPersonaSpeaking(false);
      if (!isLLMProcessing && !intuitionApproved && anamClientRef.current) {
         anamClientRef.current.unmuteInputAudio();
      }
    }
  };

  // Effect to reset state when problem changes
  useEffect(() => {
    console.log("AITile: Problem metadata changed to:", problemMetadata?.id);
    initAttemptedForProblemRef.current = null; // Reset init attempt flag for the new problem
    setIntuitionApproved(false); // Assuming parent resets this or it's reset here
    setVideoLoading(true);
    setPersonaDisplayText("Initializing for new problem...");
    setIsAnamReady(false);
    setAnamConnectionError(null);

    // Stop any existing Anam client if problem changes
    if (anamClientRef.current) {
      console.log("AITile: New problem, stopping previous Anam client.");
      anamClientRef.current.stopStreaming().catch(e => console.error("Error stopping stream on problem change:", e));
      anamClientRef.current = null;
    }
  }, [problemMetadata?.id, setIntuitionApproved]); // Depend on problem ID

  // Main Anam Initialization Effect
  useEffect(() => {
    let currentAnamClient = null; // Local variable for cleanup within this effect's scope

    const init = async () => {
      // Prevent re-initialization for the same problem if already attempted or if intuition is approved
      var token = sessionToken
      if (!token){
        token = await refreshSessionToken()
      }
      if (initAttemptedForProblemRef.current === problemMetadata?.id || intuitionApproved) {
        console.log("Skipping Anam initialization: already attempted for this problem or intuition approved.");
        if (intuitionApproved) setVideoLoading(false); // Don't show video loading if approved
        return;
      }

      
      

      // Crucial checks before attempting to initialize
      if (!PERSONA_ID) {
        setAnamConnectionError("AI Assistant not configured (Persona ID missing).");
        setVideoLoading(false); return;
      }
      if (tokenLoading) {
        setPersonaDisplayText("Fetching session token...");
        setVideoLoading(true); return; // Wait for token
      }
      if (tokenError || !token) {
        setAnamConnectionError(`Failed to get session token: ${tokenError || 'Token not available'}`);
        setVideoLoading(false); return;
      }
      if (!problemMetadata?.short_description) {
        setPersonaDisplayText("Waiting for problem details...");
        setVideoLoading(false); return; // Wait for problem details
      }

      initAttemptedForProblemRef.current = problemMetadata.id; // Mark init as attempted for *this* problem
      setVideoLoading(true);
      setAnamConnectionError(null);
      setIsAnamReady(false);
      setPersonaDisplayText("Connecting to AI assistant...");
      console.log("Attempting Anam initialization with Persona ID:", PERSONA_ID, "and Session Token:", sessionToken ? "Exists" : "Missing");

      try {
        const client = createClient(token, { personaId: PERSONA_ID, disableBrains: true });
        anamClientRef.current = client;
        currentAnamClient = client;
        console.log("Anam: Client created.");

        client.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => { /* ... */ console.log("Anam: ✅ CONNECTION_ESTABLISHED."); setPersonaDisplayText("Preparing AI assistant..."); });
        client.addListener(AnamEvent.CONNECTION_CLOSED, (reason) => { /* ... */ console.warn("Anam: ❌ CONNECTION_CLOSED:", reason); setAnamConnectionError(`Connection closed: ${reason?.message || 'Unknown reason'}`); setVideoLoading(false); setIsLLMProcessing(false); setIsPersonaSpeaking(false); setIsAnamReady(false); });
        client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
          console.log("Anam: ✅ VIDEO_PLAY_STARTED.");
          setVideoLoading(false);
          setIsAnamReady(true);
          setTimeout(async () => {
            if (anamClientRef.current && !intuitionApproved) {
              const greeting = `Hey ${userProfile?.name || 'there'}! I’m Daniel. Let’s dive into this. I’ll read the problem, you think it through, then tell me your approach. The problem is: ${problemMetadata.short_description}`;
              await speakAndDisplay(greeting);
            }
          }, 1000);
        });
        client.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, async (messageHistory) => { /* ... (existing logic) ... */
            if (intuitionApproved || isPersonaSpeaking || !anamClientRef.current || !isAnamReady) return;
            const lastMessage = messageHistory[messageHistory.length - 1];
            if (lastMessage.role !== 'user') return;
            if (abortControllerRef.current) abortControllerRef.current.abort();
            abortControllerRef.current = new AbortController();
            setIsLLMProcessing(true);
            await speakAndDisplay("Okay, let me think about that...", true);
            try {
                const response = await getPersonaResponse(messageHistory, problemMetadata, abortControllerRef.current.signal);
                if (!response) { await speakAndDisplay("I had trouble processing that. Could you try again?"); return; }
                if (response.percentage > 50) {
                setConversationHistory(anamClientRef.current.getMessageHistory?.() || []);
                await speakAndDisplay('Great! Your intuition is on the right track. You can proceed to code.');
                setTimeout(() => setIntuitionApproved(true), 3000);
                } else {
                await speakAndDisplay(response.hints.join(' ') || 'Try again with more detail.');
                }
            } catch (error) {
                setIsLLMProcessing(false);
                if (error.name === 'AbortError') { console.log('LLM request aborted.'); }
                else { console.error("Error in respondToUser:", error); await speakAndDisplay("Sorry, an error occurred."); }
            }
        });

        const videoElementId = "anam-video-element";
        const audioElementId = "anam-audio-element";
        if (document.getElementById(videoElementId) && document.getElementById(audioElementId)) {
            console.log(`Anam: Attempting to stream to element IDs: ${videoElementId}, ${audioElementId}`);
            await client.streamToVideoAndAudioElements(videoElementId, audioElementId);
            console.log("Anam: streamToVideoAndAudioElements call completed.");
        } else {
            throw new Error("Target media elements not found for Anam stream.");
        }
      } catch (error) {
        console.error("Anam: Error during initAnam:", error);
        setAnamConnectionError(error.message || "Failed to initialize AI assistant.");
        setVideoLoading(false); setIsLLMProcessing(false); setIsPersonaSpeaking(false); setIsAnamReady(false);
      }
    };

    init(); // Call the async init function

    return () => {
      console.log("AITile cleanup for main init useEffect. Current Anam Client:", !!currentAnamClient);
      if (currentAnamClient) {
        console.log("Stopping Anam client via currentAnamClient in main useEffect cleanup.");
        currentAnamClient.stopStreaming()
          .catch(err => console.error("Error stopping Anam stream on unmount/re-run:", err));
      }
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  // Re-run this effect if these key dependencies change.
  }, [sessionToken, problemMetadata?.id, intuitionApproved, refreshSessionToken, setConversationHistory, setIntuitionApproved, userProfile, tokenLoading, tokenError, problemMetadata?.short_description]);


  useEffect(() => {
    if(intuitionApproved && anamClientRef.current) {
      console.log("Intuition approved, explicitly stopping Anam client.");
      anamClientRef.current.stopStreaming()
        .catch(err => console.error("Error stopping Anam stream on intuition approval:", err));
      setPersonaDisplayText("Great! Let's get to coding.");
      setIsAnamReady(false);
      // initAttemptedRef.current = problemMetadata?.id; // Mark as "done" for this problem
    }
  },[intuitionApproved, problemMetadata?.id]); // Added problemMetadata?.id

  const videoWrapperClass = fullScreen ? styles.videoWrapperFullScreen : styles.videoWrapper;
  const difficultyClass = getDifficultyClass(problemMetadata?.difficulty);

  let currentDisplayMessage = personaDisplayText;
  if (isLLMProcessing && !personaDisplayText.includes("think about that")) {
      currentDisplayMessage = "Daniel is thinking...";
  }

  if (!PERSONA_ID && !anamConnectionError) { // Show specific error if PERSONA_ID is the issue
      return (
          <div className={`${styles.aiTileContainer} ${getDifficultyBorderClass(problemMetadata?.difficulty)}`}>
              <div className={styles.errorText}>AI Assistant Error: Persona ID not configured. Please check environment variables and restart the application.</div>
          </div>
      );
  }

  return (
    <div className={`${styles.aiTileContainer} ${getDifficultyBorderClass(problemMetadata?.difficulty)}`}>
      <video id="anam-video-element" autoPlay playsInline muted className={`${videoLoading?'hidden':''} object-cover w-full h-full`}></video>
      <audio id="anam-audio-element" autoPlay className={`${videoLoading?'hidden':''}`}></audio>

      {/* {anamConnectionError && (
        <div className={styles.errorText}>Connection Error: {anamConnectionError}</div>
      )} */}

      {!anamConnectionError && videoLoading && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <span className={`loading loading-bars loading-xl ${difficultyClass}`}></span>
          {/* <p className={`${styles.personaTextDisplay} ${styles.personaTextDisplayVisible}`}>
            {currentDisplayMessage}
          </p> */}
        </div>
      )}

      {/* {!anamConnectionError && !videoLoading && (
        <>
          <div className={`${videoWrapperClass}`}>
             <div id="anam-video-container" className={styles.videoElement}>
             </div>
          </div>
          <div className={`${styles.personaTextDisplay} ${(currentDisplayMessage || isLLMProcessing) ? styles.personaTextDisplayVisible : ''}`}>
            {currentDisplayMessage}
          </div>
        </>
      )} */}
    </div>
  );
};

export default AITile;
