// hooks/useAnamSessionToken.js
import { useCallback } from 'react';
import useAnamStore from '../stores/anamStore';
import { baseURL } from '../utils/getBaseURL';

export default function useAnamSessionToken() {
  const sessionToken = useAnamStore((state) => state.sessionToken);
  const setSessionToken = useAnamStore((state) => state.setSessionToken);

  const fetchSessionToken = useCallback(async () => {
    try {
      const res = await fetch(`${baseURL}/api/anam/session-token`);
      const data = await res.json();

      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
        console.log("Session token refreshed:", data.sessionToken);
        return data.sessionToken;
      } else {
        throw new Error("Token missing in response");
      }
    } catch (err) {
      console.error("Failed to fetch Anam session token:", err);
      return null;
    }
  }, [setSessionToken]);

  const ensureSessionToken = useCallback(async () => {
    if (sessionToken) {
      return sessionToken;
    } else {
      return await fetchSessionToken();
    }
  }, [sessionToken, fetchSessionToken]);

  return {
    sessionToken,
    ensureSessionToken,
    refreshSessionToken: fetchSessionToken,
  };
}