import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * ThemeToggle Component
 *
 * A single, direct toggle button that displays the active theme ("Dark" or "Light").
 * System dark mode is detected automatically behind the scenes.
 * Clicking immediately toggles between Dark and Light mode without any dropdown.
 */
export default function ThemeToggle({ className = '', variant = 'default', ...props }) {
  const { isDark, isSystem, toggleTheme, resetToSystem } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      onDoubleClick={(e) => {
        e.stopPropagation();
        resetToSystem();
      }}
      aria-label={`Current theme is ${isDark ? 'Dark' : 'Light'} (${isSystem ? 'System Auto' : 'Manual'}). Click to switch to ${isDark ? 'Light' : 'Dark'} mode.`}
      title={
        isSystem
          ? `Theme: Auto (${isDark ? 'Dark' : 'Light'}) • Click to switch to ${isDark ? 'Light' : 'Dark'}`
          : `Theme: ${isDark ? 'Dark' : 'Light'} • Click to switch to ${isDark ? 'Light' : 'Dark'} • Double-click for Auto`
      }
      className={`group relative inline-flex items-center justify-center w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-2xs ${
        isDark
          ? 'bg-[#111e14] hover:bg-[#16271a] text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_2px_12px_rgba(0,0,0,0.5)]'
          : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-amber-700 border border-slate-200/90 hover:border-amber-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      } ${className}`}
      {...props}
    >
      {isDark ? (
        <svg
          className="w-4 h-4 text-emerald-400 transition-transform duration-300 group-hover:-rotate-12 group-hover:scale-110"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-amber-500 transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="4" strokeWidth="2.2" stroke="currentColor" fill="#fef3c7" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41m14.14-14.14l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
