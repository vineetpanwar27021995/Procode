import {
    create
} from 'zustand';

export const useThemeStore = create((set) => ({
    darkMode: true,
    toggleTheme: () => set((state) => ({
        darkMode: !state.darkMode
    })),
}));