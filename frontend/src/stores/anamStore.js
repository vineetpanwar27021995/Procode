import { create } from 'zustand';

const useAnamStore = create((set) => ({
  sessionToken: null,
  setSessionToken: (token) => set({ sessionToken: token }),
}));

export default useAnamStore;