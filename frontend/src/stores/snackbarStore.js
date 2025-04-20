import { create } from 'zustand';

export const useSnackbarStore = create((set) => ({
  message: '',
  type: 'info',
  isVisible: false,
  showSnackbar: (message, type = 'info') => set({ message, type, isVisible: true }),
  hideSnackbar: () => set({ isVisible: false })
}));