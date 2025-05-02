
import { useEffect, useRef, useState } from "react";
import { AnamEvent } from "@anam-ai/js-sdk/dist/module/types";
import { getPersonaResponse } from "../../utils/AnalyzeIntution";
import { createClient } from '@anam-ai/js-sdk';
import useAnamSessionToken from '../../hooks/useAnamSessionToken';
import debounce from 'lodash/debounce';
import { useAnamStore } from '../../stores/anamStore';
import { getDifficultyClass, getDifficultyBorderClass } from "../../utils/UIHelper";
import {useUserStore} from '../../stores/userStore';

const PERSONA_ID = process.env.REACT_APP_ANAM_PERSONA_ID;

const AITile = ({ fullScreen = false, setIntuitionApproved, intuitionApproved, problemMetadata }) => {
  const { sessionToken, refreshSessionToken } = useAnamSessionToken();
  const setConversationHistory = useAnamStore((state) => state.setConversationHistory);
  const userProfile = useUserStore((state) => state.userProfile);

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
          `Hey ${userProfile?.name || ''}! I’m Daniel — let’s dive into a question together. I’ll read it out, you take a minute to think it through, and we’ll talk about your approach. If it makes sense, you can start coding. Let’s crush this! <break time='1s'/> 
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

  if (fullScreen) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-center text-base-content font-semibold relative rounded-md border ${getDifficultyBorderClass(problemMetadata.difficulty)} p-2`}>
          
        <>
          {loading && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <span className={`loading loading-bars loading-xl ${getDifficultyClass(problemMetadata.difficulty)} `}></span>
        </div>
          )
          }
          <div className={`${loading ? 'hidden' : ''}`}>
            <video id="video-id" width="100%" autoPlay playsInline></video>
            <audio id="audio-id" autoPlay></audio>
          </div>
        </>
      </div>
    );
  }

  return (
    <>
    <div className={`rounded-md border ${getDifficultyBorderClass(problemMetadata.difficulty)} p-2`}>
      <>
      {loading && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <span className={`loading loading-bars loading-xl ${getDifficultyClass(problemMetadata.difficulty)} `}></span>
        </div>
          )
          }
          <div className={`${loading ? 'hidden' : ''}`}>
            <video id="video-id" width="100%" autoPlay playsInline></video>
            <audio id="audio-id" autoPlay></audio>
          </div>
        </>
    </div>
    </>

  );
};

export default AITile;