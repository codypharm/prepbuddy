import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Use ref to track initialization and prevent multiple rapid theme changes
  const isInitialized = useRef(false);
  const lastToggleTime = useRef(0);
  
  // Get initial theme only once on mount
  const getInitialTheme = (): Theme => {
    // For SSR safety
    if (typeof window === "undefined") return "dark";
    
    // Check localStorage first
    const savedTheme = localStorage.getItem("prepbuddy-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    
    // Also check user preferences in case that's where the theme is stored
    try {
      const userData = localStorage.getItem("prepbuddy-user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user?.preferences?.theme === "light" || user?.preferences?.theme === "dark") {
          // Synchronize with our theme storage
          localStorage.setItem("prepbuddy-theme", user.preferences.theme);
          return user.preferences.theme;
        }
      }
    } catch (e) {
      console.error("Error reading user preferences", e);
    }
    
    // Check system preference if no localStorage value
    if (window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    
    // Default to dark theme
    return "dark";
  };
  
  // Initialize state with the selected theme
  const [theme, setThemeState] = useState<Theme>(getInitialTheme());
  
  // Helper function to apply theme to DOM
  const applyThemeToDOM = useCallback((newTheme: Theme) => {
    const root = document.documentElement;
    
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    
    // Save to localStorage
    try {
      localStorage.setItem("prepbuddy-theme", newTheme);
      
      // Sync with user preferences if they exist
      const userData = localStorage.getItem("prepbuddy-user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user.preferences) {
          // Only update if the theme is different
          if (user.preferences.theme !== newTheme) {
            user.preferences.theme = newTheme;
            localStorage.setItem("prepbuddy-user", JSON.stringify(user));
          }
        }
      }
    } catch (error) {
      console.error("Failed to save theme preference", error);
    }
  }, []);
  
  // Initialize theme once on mount
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized.current) return;
    
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    applyThemeToDOM(initialTheme);
    
    // Listen for localStorage changes from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "prepbuddy-theme" && e.newValue) {
        if (e.newValue === "light" || e.newValue === "dark") {
          setThemeState(e.newValue);
        }
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    isInitialized.current = true;
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [applyThemeToDOM]);
  
  // Update DOM when theme state changes
  useEffect(() => {
    if (!isInitialized.current) return;
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);
  
  // Toggle theme function with debounce to prevent rapid changes
  const toggleTheme = useCallback(() => {
    const now = Date.now();
    // Prevent toggle spam - minimum 300ms between toggles
    if (now - lastToggleTime.current < 300) return;
    
    lastToggleTime.current = now;
    
    setThemeState(currentTheme => {
      const newTheme = currentTheme === "light" ? "dark" : "light";
      return newTheme;
    });
  }, []);
  
  // Set theme function with validation
  const setTheme = useCallback((newTheme: Theme) => {
    if (newTheme !== "light" && newTheme !== "dark") {
      console.error("Invalid theme value:", newTheme);
      return;
    }
    
    setThemeState(newTheme);
  }, []);
  
  // Create memoized context value
  const contextValue = {
    theme,
    toggleTheme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
