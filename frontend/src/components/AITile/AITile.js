import React, { useEffect, useRef, useState, useCallback } from "react";
import { AnamEvent } from "@anam-ai/js-sdk/dist/module/types";
import { createClient } from '@anam-ai/js-sdk';
import useAnamSessionToken from '../../hooks/useAnamSessionToken'; // Adjust path
import { useAnamStore } from '../../stores/anamStore'; // Adjust path

import { getDifficultyClass, getDifficultyBorderClass } from "../../utils/UIHelper"; // Adjust path
import { useUserStore } from '../../stores/userStore'; // Adjust path
import styles from '../../styles/AITile.module.css'; // Adjust path
const PERSONA_ID = process.env.REACT_APP_ANAM_PERSONA_ID;

const AITile = ({
  fullScreen = false,
  setIntuitionApproved,
  intuitionApproved,
  problemMetadata,
  // WebSocket related props from CodingSession
  isWebSocketReady,
  onSendToWebSocket,
  receivedWebSocketMessage,
  webSocketGlobalError // Global WebSocket errors from parent
}) => {

  const { sessionToken, refreshSessionToken, loading: tokenLoading, error: tokenError } = useAnamSessionToken();
  const setConversationHistory = useAnamStore((state) => state.setConversationHistory);
  const userProfile = useUserStore((state) => state.userProfile);
  // const setSessionToken = useAnamSessionToken((state)=>state.setSessionToken)

  const anamClientRef = useRef(null);
  const initAttemptedForProblemRef = useRef(null); // To prevent re-init for the same problem
  const videoLoadingRef = useRef(true);
  const [videoLoading, setVideoLoading] = useState(true);
  
  const talkMessageStreamRef = useRef(null);

  const [personaDisplayText, setPersonaDisplayText] = useState("Initializing AI Assistant...");
  const [isPersonaSpeaking, setIsPersonaSpeaking] = useState(false);
  const [isLLMProcessing, setIsLLMProcessing] = useState(false);
  const [anamConnectionError, setAnamConnectionError] = useState(null);
  const [isAnamReady, setIsAnamReady] = useState(false);
  const [currentUserTranscript, setCurrentUserTranscript] = useState("");

  useEffect(() => {
    if (!PERSONA_ID) {
      console.error("AITile FATAL ERROR: REACT_APP_ANAM_PERSONA_ID is not set.");
      setAnamConnectionError("AI Assistant not configured (Persona ID missing).");
    }
  }, []);

  // Memoized speakAndDisplay
  const speakAndDisplay = useCallback(async (textToSpeak, isThinkingAck = false) => {
    if (!anamClientRef.current) {
      console.warn("Anam client not ready, cannot speak.", { isAnamReady, clientExists: !!anamClientRef.current });
      setPersonaDisplayText("AI assistant is not ready to speak.");
      return;
    }
    console.log("SpeakAndDisplay (AITile):", textToSpeak.substring(0, 50) + "...");
    
    if (!isThinkingAck) { // Only clear user transcript if it's not just an ack
        setCurrentUserTranscript("");
    }
    setPersonaDisplayText(textToSpeak); // Display the full message to be spoken

    if (!isThinkingAck) setIsLLMProcessing(false); // Backend LLM call is done if this is a final response

    try {
      setIsPersonaSpeaking(true);
      anamClientRef.current.muteInputAudio();
      await anamClientRef.current.talk(textToSpeak);
    } catch (error) {
      console.error("Anam talk error:", error);
      setPersonaDisplayText("Sorry, I had trouble speaking.");
      setAnamConnectionError(`Error during speech: ${error.message}`);
    } finally {
      setIsPersonaSpeaking(false);
      // Unmute only if not approved, Anam is ready, and WS is ready (for next interaction)
      if (!intuitionApproved && anamClientRef.current && isWebSocketReady && !isLLMProcessing) {
         anamClientRef.current.unmuteInputAudio();
      }
    }
  }, [isAnamReady, intuitionApproved, isWebSocketReady, isLLMProcessing]); // Added dependencies

  // Effect to reset and initialize Anam (NOT WebSocket)
  useEffect(() => {
    console.log("AITile: Problem metadata ID or intuitionApproved changed. Resetting Anam state.", { problemId: problemMetadata?.id, intuitionApproved });
    
    // Reset Anam-specific states
    initAttemptedForProblemRef.current = null; // Allow re-init for new problem
    videoLoadingRef.current = true;
    setVideoLoading(true);
    setPersonaDisplayText("Initializing AI assistant...");
    setIsAnamReady(false);
    setAnamConnectionError(null); // Clear local Anam errors
    setCurrentUserTranscript("");
    setIsLLMProcessing(false);
    setIsPersonaSpeaking(false);

    if (talkMessageStreamRef.current) {
        talkMessageStreamRef.current = null; // Clear any existing talk stream
    }

    if (anamClientRef.current) {
      console.log("AITile: Stopping previous Anam client due to prop change or intuition approval.");
      anamClientRef.current.stopStreaming().catch(e => console.error("Error stopping Anam stream on prop change:", e));
      anamClientRef.current = null;
    }
    // WebSocket is managed by CodingSession, no WS cleanup here
  }, [problemMetadata?.id]); // Only re-init Anam if problem ID changes. Intuition approval handled separately for stopping.

  // Effect for intuitionApproved changes (specifically for stopping Anam)
  useEffect(() => {
    if(intuitionApproved && anamClientRef.current) {
      console.log("Intuition approved, explicitly stopping Anam client from AITile.");
      anamClientRef.current.stopStreaming()
        .catch(err => console.error("Error stopping Anam stream on intuition approval:", err));
      setPersonaDisplayText("Great! Let's get to coding."); // This might be overridden by parent quickly
      setIsAnamReady(false); // Anam is no longer active
      anamClientRef.current = null;
    }
  },[intuitionApproved]);


  // Main Anam Initialization Effect
  useEffect(() => {
    let currentAnamClient = null; // To use in cleanup

    const initAnam = async () => {
      var token = sessionToken; // Use local var for token
      if (!token && !tokenLoading && !tokenError) { // If no token, not loading, and no error, try refreshing
          console.log("AITile: Attempting to refresh session token for Anam init.");
          token = await refreshSessionToken();
      }

      if (initAttemptedForProblemRef.current === problemMetadata?.id || intuitionApproved) {
        if (intuitionApproved) setVideoLoading(false);
        console.log("AITile: Skipping Anam init. Attempted or intuition approved.", { problemId: problemMetadata?.id, initAttempted: initAttemptedForProblemRef.current, intuitionApproved });
        return;
      }
      if (!PERSONA_ID) { setAnamConnectionError("AI Assistant not configured (Persona ID missing)."); setVideoLoading(false); return; }
      if (tokenLoading) { setPersonaDisplayText("Fetching session token..."); setVideoLoading(true); return; }
      if (tokenError || !token) { setAnamConnectionError(`Failed to get session token: ${tokenError || 'Token not available'}`); setVideoLoading(false); return; }
      if (!problemMetadata?.short_description) { setPersonaDisplayText("Waiting for problem details..."); setVideoLoading(false); return; }

      initAttemptedForProblemRef.current = problemMetadata.id;
      setVideoLoading(true);
      setAnamConnectionError(null); // Clear previous Anam errors
      setIsAnamReady(false);
      setPersonaDisplayText("Connecting to AI assistant...");
      console.log("AITile: Attempting Anam client initialization for problem:", problemMetadata.id);

      try {
        const client = createClient(token, { personaId: PERSONA_ID, disableBrains: true });
        anamClientRef.current = client;
        currentAnamClient = client; // For cleanup
        console.log("Anam (AITile): Client created.");

        client.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
          console.log("Anam (AITile): ✅ CONNECTION_ESTABLISHED.");
          setPersonaDisplayText("Preparing AI assistant...");
        });
        client.addListener(AnamEvent.CONNECTION_CLOSED, (reason) => {
          console.warn("Anam (AITile): 🔌 CONNECTION_CLOSED.", reason);
          if (!intuitionApproved) { // Don't show error if closed due to approval
            // setAnamConnectionError(`Anam connection closed: ${reason?.message || 'Unknown reason'}`);
          }
          setIsAnamReady(false);
        });
        client.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
          console.log("Anam (AITile): ✅ VIDEO_PLAY_STARTED.");
          setVideoLoading(false);
          setIsAnamReady(true);
          // Greeting only if WS is also ready
          setTimeout(async () => {
            if (anamClientRef.current && !intuitionApproved && isWebSocketReady) { // Check isWebSocketReady
              const greeting = `Hey ${userProfile?.name || 'there'}! I’m Daniel. Let’s dive into this. I’ll read the problem, you think it through, then tell me your approach. The problem is: ${problemMetadata.short_description}`;
              await speakAndDisplay(greeting);
            } else if (!isWebSocketReady && !intuitionApproved) {
                setPersonaDisplayText("AI assistant ready. Waiting for analysis service...");
            }
          }, 1000);
        });

        client.addListener(AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED, async (message) => {
          console.log(message)
          if (intuitionApproved || isPersonaSpeaking || !anamClientRef.current || isLLMProcessing) return;
          if (message && message.content && message.role === 'user') {
            setCurrentUserTranscript(prev => prev + message.content);
            if (message.endOfSpeech) {
                const finalTranscript = currentUserTranscript + message.content; // Combine with last fragment
                console.log("Anam (AITile): Final transcript by user:", finalTranscript);
                setCurrentUserTranscript(finalTranscript); // Show final transcript briefly

                if (isWebSocketReady && onSendToWebSocket) {
                    const currentHistory = anamClientRef.current.messageHistoryClient.messages || [];
                    // Add the current user message to history before sending
                    const userMessageForHistory = { role: 'user', content: finalTranscript, timestamp: new Date().toISOString() };
                    const historyToSend = [...currentHistory, userMessageForHistory];

                    console.log("AITile: Sending to WebSocket for analysis via prop:", finalTranscript);
                    onSendToWebSocket({
                        type: 'ANALYZE_INTUITION_STREAM',
                        payload: { messageHistory: historyToSend, problemMetadata }
                    });
                    setIsLLMProcessing(true); // Now waiting for backend
                    // Don't clear currentUserTranscript immediately, let personaDisplayText update
                    setPersonaDisplayText("Okay, let me think about that..."); // Thinking message
                    // speakAndDisplay("Okay, let me think about that...", true); // Optional: speak the thinking ack
                } else {
                    console.error("AITile: WebSocket not ready or send function not available. Cannot send user input.");
                    setAnamConnectionError("Analysis service not available. Please try again.");
                    setPersonaDisplayText("Connection issue for analysis. Please try again.");
                }
            }
          }
        });

        const videoElementId = "anam-video-element";
        const audioElementId = "anam-audio-element";
        if (document.getElementById(videoElementId) && document.getElementById(audioElementId)) {
          await client.streamToVideoAndAudioElements(videoElementId, audioElementId);
          console.log("Anam (AITile): streamToVideoAndAudioElements call completed.");
        } else {
          throw new Error("Target media elements not found for Anam stream.");
        }

      } catch (error) {
        console.error("Anam (AITile): Error during initAnam:", error);
        setAnamConnectionError(error.message || "Failed to initialize AI assistant.");
        setVideoLoading(false); setIsLLMProcessing(false); setIsPersonaSpeaking(false); setIsAnamReady(false);
      }
    };

    if (!intuitionApproved && problemMetadata?.id) { // Only init if not approved and problem exists
        initAnam();
    }

    return () => {
      // const resetToken = async () =>{
      //   // setSessionToken(null)
      // }
      console.log("AITile cleanup for main Anam init useEffect. Current client:", !!currentAnamClient);
      if (currentAnamClient) { // Use the client captured at the start of this effect instance
        currentAnamClient.stopStreaming().catch(err => console.error("Error stopping Anam stream in cleanup:", err));
        // resetToken()
      }
      if (talkMessageStreamRef.current) {
          talkMessageStreamRef.current = null;
      }
      

      // No WebSocket cleanup here, handled by parent
    };
  }, [
    sessionToken, problemMetadata?.id, // Anam init depends on these
    intuitionApproved, // To stop/prevent init
    refreshSessionToken, userProfile, tokenLoading, tokenError, problemMetadata?.short_description, // For init logic
    speakAndDisplay, // speakAndDisplay is memoized, include if used in init sequence (greeting)
    isWebSocketReady, onSendToWebSocket // For enabling user input sending & greeting logic
  ]);


  // Effect to handle messages received from WebSocket (via props)
  useEffect(() => {
    if (!receivedWebSocketMessage) return;

    const { type, payload, id } = receivedWebSocketMessage; // id is for triggering effect
    console.log("AITile: Processing WebSocket message from prop:", type, payload);

    // Reset LLM processing state if it's a message that signifies end of a request or start of new data
    if (type !== 'LLM_CHUNK' || (type === 'LLM_CHUNK' && !isLLMProcessing && !isPersonaSpeaking)) {
        // If it's the first chunk, or a non-chunk message, LLM processing (waiting for first byte) is over.
    }
    // More fine-grained control of isLLMProcessing:
    // Set to true when sending, false on first LLM_CHUNK, or on ANALYSIS_COMPLETE/LLM_STREAM_END/ERROR.

    if (type === 'LLM_CHUNK') {
        setIsLLMProcessing(false); // We are now receiving data, so backend isn't "thinking" anymore
        if (!talkMessageStreamRef.current && anamClientRef.current && isAnamReady) {
            talkMessageStreamRef.current = anamClientRef.current.createTalkMessageStream();
            console.log("Anam (AITile): Created talk message stream for LLM_CHUNK.");
            setPersonaDisplayText(""); // Clear "thinking..." or previous text
            setIsPersonaSpeaking(true);
            anamClientRef.current.muteInputAudio();
        }
        if (talkMessageStreamRef.current) {
            setPersonaDisplayText(prev => prev + payload.chunk);
            talkMessageStreamRef.current.streamMessageChunk(payload.chunk, payload.isFinalTTSChunk);
            if (payload.isFinalTTSChunk) {
                console.log("Anam (AITile): Final TTS chunk streamed for this segment.");
                // The stream might continue with more segments for a long response.
                // Actual end of speech is when Anam SDK finishes TTS.
            }
        } else if (!isAnamReady && payload.chunk) { // Anam not ready, but we got text
            setPersonaDisplayText(prev => prev + payload.chunk); // Accumulate for display
        }
    } else if (type === 'ANALYSIS_COMPLETE') {
        setIsLLMProcessing(false);
        if (talkMessageStreamRef.current) { // Ensure any ongoing stream is finalized
            // talkMessageStreamRef.current.streamMessageChunk("", true); // Flush with empty final chunk
            talkMessageStreamRef.current = null;
        }
        setIsPersonaSpeaking(false); // Stop visual speaking indicator before new speech
        setPersonaDisplayText(""); // Clear any streamed text before speaking final analysis

        if (payload.percentage > 50) {
            setConversationHistory(anamClientRef.current?.messageHistoryClient?.messages || []);
            speakAndDisplay(payload.fullResponse || 'Great! Your intuition is on the right track. You can proceed to code.')
                .then(() => setTimeout(() => setIntuitionApproved(true), 1000));
        } else {
            speakAndDisplay(payload.fullResponse || payload.hints?.join(' ') || 'Try again with more detail.');
        }
    } else if (type === 'LLM_STREAM_END') {
        setIsLLMProcessing(false);
        if (talkMessageStreamRef.current) {
            // talkMessageStreamRef.current.streamMessageChunk("", true); // Ensure stream is flushed
            talkMessageStreamRef.current = null;
        }
        setIsPersonaSpeaking(false);
        // Unmute only if not approved and Anam is ready and WS is ready
        if (!intuitionApproved && anamClientRef.current && isWebSocketReady) {
            anamClientRef.current.unmuteInputAudio();
        }
        // PersonaDisplayText should ideally be the fully accumulated text here.
    } else if (type === 'ERROR') {
        setIsLLMProcessing(false);
        setAnamConnectionError(`AI Error: ${payload.message || JSON.stringify(payload)}`);
        setPersonaDisplayText(`Error from AI: ${payload.message || 'An issue occurred.'}`);
        if (talkMessageStreamRef.current) talkMessageStreamRef.current = null;
        setIsPersonaSpeaking(false);
        if (!intuitionApproved && anamClientRef.current && isWebSocketReady) {
            anamClientRef.current.unmuteInputAudio();
        }
    }
  }, [receivedWebSocketMessage, isAnamReady, intuitionApproved, setIntuitionApproved, speakAndDisplay, setConversationHistory, isWebSocketReady]);

  // Handle global WebSocket errors from parent
  useEffect(() => {
    if (webSocketGlobalError) {
      setAnamConnectionError(webSocketGlobalError); // Display global WS errors locally too
      // Potentially stop LLM processing if a global WS error occurs
      // setIsLLMProcessing(false);
    }
  }, [webSocketGlobalError]);


  const difficultyClass = getDifficultyClass(problemMetadata?.difficulty);

  let displayMessage = personaDisplayText;
  if (!isPersonaSpeaking && currentUserTranscript && !isLLMProcessing) { // Show user transcript if AI isn't speaking/thinking and user spoke
      displayMessage = `You: ${currentUserTranscript}`;
  } else if (isLLMProcessing && !isPersonaSpeaking && !personaDisplayText.includes("Okay, let me think")) { // If actively processing and not already showing thinking
      displayMessage = "Daniel is thinking...";
  }


  if (!PERSONA_ID && !anamConnectionError) {
      return (
          <div className={`${styles.aiTileContainer} ${getDifficultyBorderClass(problemMetadata?.difficulty)}`}>
              <div className={styles.errorText}>AI Assistant Error: Persona ID not configured.</div>
          </div>
      );
  }

  return (
    <div className={`${styles.aiTileContainer} ${getDifficultyBorderClass(problemMetadata?.difficulty)}`}>
      <video id="anam-video-element" className={`${videoLoading || intuitionApproved ?'hidden':''} object-cover w-full h-full`} playsInline muted autoPlay></video>
      <audio id="anam-audio-element" className={`${videoLoading || intuitionApproved ?'hidden':''}`} autoPlay></audio>

  
      {(!anamConnectionError || videoLoading) && videoLoading && !intuitionApproved && ( // Show loader only if no error or if it's just video loading
        <div className="flex flex-col items-center justify-center space-y-4 h-full">
          <span className={`loading loading-bars loading-xl ${difficultyClass}`}></span>
        </div>
      )}
    </div>
  );
};

export default AITile;
