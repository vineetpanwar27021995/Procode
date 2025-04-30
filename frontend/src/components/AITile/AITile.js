
import { useEffect, useRef, useState } from "react";
import { AnamEvent } from "@anam-ai/js-sdk/dist/module/types";
import { getPersonaResponse } from "../../utils/AnalyzeIntution";
import { createClient } from '@anam-ai/js-sdk';
import useAnamSessionToken from '../../hooks/useAnamSessionToken';


const AITile = ({ fullScreen = false, setIntuitionApproved, intuitionApproved, problemMetadata }) => {
  const { sessionToken, refreshSessionToken } = useAnamSessionToken();
  const tileRef = useRef();
  const anamClientRef = useRef(null);
  const isStreamingRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Connecting to Interviewer Avatar...");

  const onReceiveMessageStreamEvent = (message) => {
    console.log("Received message stream event:", message);
    setLoadingText(message);
  }

  const initAnam = async () => {
    try {

      let token = sessionToken;
      if (!token) {
        console.log("Session token missing, trying to refresh...");
        token = await refreshSessionToken();
        if (!token) throw new Error("Unable to obtain session token.");
      }

      const anamClient = createClient(token, {
        personaId: '48a4fcfd-6f72-4fda-86c4-88b3f9dad473',
      });

      anamClientRef.current = anamClient;

      anamClient.addListener(AnamEvent.CONNECTION_ESTABLISHED, () => {
        setLoadingText("Connected. Starting video stream...");
      });

      anamClient.addListener(AnamEvent.VIDEO_PLAY_STARTED, () => {
        setLoading(false);
      });

      anamClient.addListener(AnamEvent.CONNECTION_CLOSED, (reason) => {
        console.log("Connection closed:", reason);
      });

      /**
       * Gets the persona response from a custom LLM (GPT-3.5-turbo)
       */
      const respondToUser = async (messageHistory) => {
        console.log('getPersonaResponse message history:', messageHistory);
        if (messageHistory.length > 0) {
          // only respond to user messages
          const lastMessage = messageHistory[messageHistory.length - 1];
          if (lastMessage.role === 'user') {
            const response = await getPersonaResponse(messageHistory, problemMetadata);
            console.log("Persona response:", response);
            if(response.percentage > 50) {
              await anamClient.talk('Great! Your intuition is on the right track. You can proceed to code.');
              setTimeout(() => {
                setIntuitionApproved(true);
              }, 5000);
              // save it to the DB
            } else {
              await anamClient.talk(response.hints.join(' '));
            }
            
          }
        }
      };

      anamClient.addListener(
        AnamEvent.MESSAGE_STREAM_EVENT_RECEIVED,
        onReceiveMessageStreamEvent,
      );

      // Respond to the user when the message history is updated
      anamClient.addListener(AnamEvent.MESSAGE_HISTORY_UPDATED, respondToUser);

      console.log("Created Anam client...", anamClient);

      await anamClient.streamToVideoAndAudioElements("video-id", "audio-id");

      setTimeout(() => {
        anamClient.talk(
          `Hi! I'm Daniel, your interviewer. Let's get started with the question. I’ll read it out for you, and you'll have 2 minutes to think about your approach. Feel free to share your intuition, and if it's on the right track, you can proceed to code. Best of luck! <break time='2s'/> 
          Your coding question is`
        );
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
    <div
      ref={tileRef}
      className="fixed bottom-4 right-4 w-[120px] h-[120px] bg-white shadow-lg rounded-full flex items-center justify-center border-2 border-primary cursor-grab z-50 overflow-hidden"
      onMouseDown={(e) => {
        document.onmousemove = handleDrag;
        document.onmouseup = () => (document.onmousemove = null);
      }}
      onTouchMove={handleDrag}
    >
       <>
          <video id="video-id" width="100%" height="100%" autoPlay muted playsInline></video>
          <audio id="audio-id" autoPlay></audio>
        </>

      {/* {loading ? (
        <p className="text-xs text-center px-2">{loadingText}</p>
      ) : (
        <>
          <video id="video-id" width="100%" height="100%" autoPlay muted playsInline></video>
          <audio id="audio-id" autoPlay></audio>
        </>
      )} */}
    </div>
  );
};

export default AITile;