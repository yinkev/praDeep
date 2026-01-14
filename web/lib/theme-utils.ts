/**
 * Theme utilities for common scenarios
 * Use these helper functions for theme-related logic in components
 */

import { setTheme, type Theme } from "./theme";

/**
 * Toggle theme between light and dark
 */
export function toggleTheme(currentTheme: Theme): Theme {
  const isDark = /dark$/.test(currentTheme);
  const newTheme: Theme = isDark ? "light" : "dark";
  setTheme(newTheme);
  return newTheme;
}

/**
 * Set theme to light mode
 */
export function setLightTheme(): void {
  setTheme("light");
}

/**
 * Set theme to dark mode
 */
export function setDarkTheme(): void {
  setTheme("dark");
}

/**
 * Get CSS class for theme-aware styling
 */
export function getThemeClass(theme: Theme): string {
  return /dark$/.test(theme) ? "dark" : "";
}

/**
 * Get contrast color for theme
 */
export function getTextColorForTheme(theme: Theme): string {
  return /dark$/.test(theme)
    ? "text-slate-100 dark:text-slate-100"
    : "text-slate-900 dark:text-slate-900";
}

/**
 * Get background color for theme
 */
export function getBackgroundForTheme(theme: Theme): string {
  return /dark$/.test(theme) ? "dark:bg-slate-800" : "bg-white";
}

/**
 * Watch theme changes via localStorage events
 */
export function onThemeChange(callback: (theme: Theme) => void): () => void {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === "deeptutor-theme" && e.newValue) {
      callback(e.newValue as Theme);
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Return cleanup function
  return () => {
    window.removeEventListener("storage", handleStorageChange);
  };
}
