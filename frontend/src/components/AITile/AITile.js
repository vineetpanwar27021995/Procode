
import { useEffect, useRef, useState } from "react";
import { AnamEvent } from "@anam-ai/js-sdk/dist/module/types";
import { getPersonaResponse } from "../../utils/AnalyzeIntution";
import { createClient } from '@anam-ai/js-sdk';
import useAnamSessionToken from '../../hooks/useAnamSessionToken';
import debounce from 'lodash/debounce';
import { useAnamStore } from '../../stores/anamStore';
const PERSONA_ID = process.env.REACT_APP_ANAM_PERSONA_ID;

const AITile = ({ fullScreen = false, setIntuitionApproved, intuitionApproved, problemMetadata }) => {
  const { sessionToken, refreshSessionToken } = useAnamSessionToken();
  const setConversationHistory = useAnamStore((state) => state.setConversationHistory);

  const tileRef = useRef();
  const anamClientRef = useRef(null);
  const isStreamingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef(null);

  const onReceiveMessageStreamEvent = (message) => {
    console.log("Received message stream event:", message);
  }

  const initAnam = async () => {
    try {

      console.log('Session token from AITile.js...');
      let token = sessionToken;
      if (!token) {
        console.log("Session token missing, trying to refresh...");
        token = await refreshSessionToken();
        if (!token) throw new Error("Unable to obtain session token.");
      }

      const anamClient = createClient(token, {
        personaId: PERSONA_ID,
        // personaId: '8133965d-1d8a-474a-8ddf-c71ac65e8971',
        
        disableBrains: true,
      });

      anamClientRef.current = anamClient;

      anamClient.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
        console.log("Connected. Starting video stream...");
      });

      anamClient.addListener(AnamEvent.CONNECTION_CLOSED, (reason) => {
        console.log("Connection closed:", reason);
      });

      /**
       * Gets the persona response from a custom LLM DeepSeek
       */
      const respondToUser = debounce(async (messageHistory) => {
        if (messageHistory.length === 0) return;
      
        const lastMessage = messageHistory[messageHistory.length - 1];
        if (lastMessage.role !== 'user') return;
      
        // Abort any previous pending request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
      
        const response = await getPersonaResponse(
          messageHistory,
          problemMetadata,
          abortControllerRef.current.signal
        );
      
        console.log("Persona response:", response);
      
        if (!response) return;
      
        if (response?.percentage > 50) {
          anamClient.muteInputAudio();
          // ✅ Save entire message history
          const messages = anamClient.getMessageHistory?.() || [];
          setConversationHistory(messages);

          await anamClient.talk('Great! Your intuition is on the right track. You can proceed to code.');
          setTimeout(() => setIntuitionApproved(true), 5000);
        } else {
          anamClient.muteInputAudio();
          await anamClient.talk(response.hints.join(' ') || 'Try again with more detail.');
          anamClient.unmuteInputAudio();
        }
      }, 1000); // Debounce 1000ms

      anamClient.addListener(
        AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
        onReceiveMessageStreamEvent,
      );

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        setLoading(false);
      });

      // Respond to the user when the message history is updated
      anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, respondToUser);

      console.log("Created Anam client...", anamClient);

      await anamClient.streamToVideoAndAudioElements("video-id", "audio-id");

      setTimeout(async () => {
        anamClient.muteInputAudio();
        await anamClient.talk(
          `Hi! I'm Daniel, your interviewer. Let's get started with the question. I’ll read it out for you, and you'll have 2 minutes to think about your approach. Feel free to share your intuition, and if it's on the right track, you can proceed to code. Best of luck! <break time='2s'/> 
          Your coding question is ${problemMetadata.short_description}`
        );
        anamClient.unmuteInputAudio();
      }, 2000);

    } catch (error) {
      console.error("Error initializing Anam client:", error);
    }
  };

  useEffect(() => {
    if (!isStreamingRef.current) {
      isStreamingRef.current = true;
      initAnam();
    }

    return async () => {
      if (anamClientRef.current) {
        await anamClientRef.current.stopStreaming();
      }
    };
  }, []);

  useEffect(() => {
    if(intuitionApproved) {
      console.log("Intuition approved, stopping Anam client...");
      const stopStreaming = async () => {
      if (anamClientRef.current) {
        await anamClientRef.current.stopStreaming();
      }
    }
    stopStreaming();
    }
  },[intuitionApproved])

  const handleDrag = (e) => {
    const tile = tileRef.current;
    const x = e.clientX || (e.touches && e.touches[0]?.clientX);
    const y = e.clientY || (e.touches && e.touches[0]?.clientY);
    tile.style.left = `${x - tile.offsetWidth / 2}px`;
    tile.style.top = `${y - tile.offsetHeight / 2}px`;
  };

  if (fullScreen) {
    return (
      <div className="w-full h-full flex items-center justify-center text-center text-base-content font-semibold relative">
          <>
            <video id="video-id" width="100%" autoPlay playsInline></video>
            <audio id="audio-id" autoPlay></audio>
          </>
        {/* {loading ? (
          <p>{loadingText}</p>
        ) : (
        )} */}
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white z-10">
          Loading avatar...
        </div>
      ) : (
      <>
          <video id="video-id" className="w-inherit h-inherit object-cover" autoPlay playsInline muted></video>
          <audio id="audio-id" autoPlay></audio>
        </>
      )}
    </>

  );
};

export default AITile;