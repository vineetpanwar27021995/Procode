import { create } from 'zustand';

// Helper function to get initial theme from localStorage or system preference
const getInitialDarkMode = () => {
  try {
    const storedTheme = localStorage.getItem('procode-theme');
    if (storedTheme) {
      return storedTheme === 'dark';
    }
    // If no stored theme, check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    // Fallback if localStorage or matchMedia is unavailable/errors
    console.error("Error reading theme preference:", error);
    return false; // Default to light theme on error
  }
};

export const useThemeStore = create((set) => ({
  // Initialize state from localStorage/system preference
  darkMode: getInitialDarkMode(),

  // Action to toggle the theme
  toggleDarkMode: () => set((state) => {
    const newDarkMode = !state.darkMode;
    const newTheme = newDarkMode ? 'dark' : 'light';
    try {
      // Save the new preference to localStorage
      localStorage.setItem('procode-theme', newTheme);
      console.log(`Theme set to ${newTheme} and saved to localStorage.`);
    } catch (error) {
      console.error("Error saving theme preference to localStorage:", error);
    }
    // Return the new state
    return { darkMode: newDarkMode };
  }),

  // Optional: Action to explicitly set the theme (e.g., from user settings)
  setDarkMode: (isDark) => {
     const newTheme = isDark ? 'dark' : 'light';
     try {
        localStorage.setItem('procode-theme', newTheme);
        console.log(`Theme explicitly set to ${newTheme} and saved.`);
     } catch (error) {
        console.error("Error saving theme preference to localStorage:", error);
     }
     set({ darkMode: isDark });
  }

}));

// --- Optional: Initialize theme attribute on initial load ---
// This ensures the data-theme attribute is set correctly when the store initializes,
// even before the App component mounts its useEffect.
try {
    const initialTheme = useThemeStore.getState().darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', initialTheme);
} catch(e) {
    console.error("Error setting initial data-theme attribute:", e);
}

