import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const THEME_STORAGE_KEY = 'kcc_theme_v2';
const LEGACY_STORAGE_KEY = 'kcc_theme';

/**
 * ThemeProvider Component
 * 
 * Manages theme state ('system' | 'dark' | 'light'), automatically detecting
 * and synchronizing with the user's OS / browser color scheme preferences in real-time.
 * By default, detects system theme and applies it. Users can still manually switch themes
 * via the toggle button, and switching back to match the system theme restores automatic tracking.
 */
export function ThemeProvider({ children }) {
  // Real-time system dark mode preference tracking
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Stored mode preference: 'system' | 'dark' | 'light'
  // Defaults to 'system' so it automatically detects OS / browser color scheme
  const [theme, setThemeState] = useState(() => {
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(LEGACY_STORAGE_KEY)) {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
      return 'system';
    } catch {
      return 'system';
    }
  });

  // Computed boolean indicating if the screen is currently dark
  const isDark = theme === 'system' ? systemPrefersDark : theme === 'dark';
  const isSystem = theme === 'system';

  // Listen to system OS theme changes dynamically
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e) => {
      const prefersDark = Boolean(e.matches);
      setSystemPrefersDark(prefersDark);
      
      // When system OS theme changes (e.g. Windows Dark/Light setting change),
      // adapt to the new system theme automatically and re-sync
      setThemeState('system');
      try {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } catch {
        // ignore
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }

    // Set initial value in case it changed between initial render and effect
    setSystemPrefersDark(mediaQuery.matches);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemChange);
      }
    };
  }, []);

  // Synchronize <html> root class, colorScheme style, and mobile theme-color meta tag
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    // Update browser address bar color for mobile devices
    const metaThemeColor = document.getElementById('meta-theme-color') || document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0b120c' : '#196716');
    }
  }, [isDark]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    } catch (e) {
      console.warn('Unable to persist theme to localStorage:', e);
    }
  }, []);

  const resetToSystem = useCallback(() => {
    setTheme('system');
  }, [setTheme]);

  // Smart toggle: switches between Dark and Light mode.
  // If switching brings the theme in line with the active OS system theme,
  // it automatically returns to 'system' mode to keep automatic sync alive.
  const toggleTheme = useCallback(() => {
    const nextDark = !isDark;
    const matchesSystem = (nextDark === systemPrefersDark);
    if (matchesSystem) {
      setTheme('system');
    } else {
      setTheme(nextDark ? 'dark' : 'light');
    }
  }, [isDark, systemPrefersDark, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        isSystem,
        systemPrefersDark,
        toggleTheme,
        resetToSystem
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
