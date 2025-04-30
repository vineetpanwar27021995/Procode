import { create } from 'zustand';

export const useAnamStore = create((set) => ({
  sessionToken: null,
  setSessionToken: (token) => set({ sessionToken: token }),

  conversationHistory: [],
  setConversationHistory: (messages) => set({ conversationHistory: messages }),
  clearConversationHistory: () => set({ conversationHistory: [] }),
}));
