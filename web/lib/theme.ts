/**
 * Theme persistence utilities
 *
 * Supports built-in themes (light/dark) plus extended modes such as:
 * - high-contrast-dark
 * - custom-light
 *
 * The ThemeScript runs before hydration; this module keeps React state in sync
 * without clobbering extended modes.
 */

export type Theme =
  | "light"
  | "dark"
  | "high-contrast-dark"
  | "high-contrast-light"
  | "custom-light"
  | "custom-dark";

export const THEME_STORAGE_KEY = "deeptutor-theme";
export const THEME_CUSTOM_STORAGE_KEY = "deeptutor-theme-custom";

type ThemeChangeListener = (theme: Theme) => void;
const themeListeners = new Set<ThemeChangeListener>();

/**
 * Subscribe to theme changes
 */
export function subscribeToThemeChanges(
  listener: ThemeChangeListener,
): () => void {
  themeListeners.add(listener);
  return () => themeListeners.delete(listener);
}

/**
 * Notify all listeners of theme change
 */
function notifyThemeChange(theme: Theme): void {
  themeListeners.forEach((listener) => listener(theme));
}

/**
 * Get the stored theme from localStorage
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (!stored) return null;

    // Accept explicit known themes.
    if (
      stored === "light" ||
      stored === "dark" ||
      stored === "high-contrast-dark" ||
      stored === "high-contrast-light" ||
      stored === "custom-light" ||
      stored === "custom-dark"
    ) {
      return stored;
    }

    // Be forward-compatible: accept any <name>-dark|<name>-light without overwriting.
    if (/-(dark|light)$/.test(stored)) {
      return stored as Theme;
    }
  } catch (e) {
    // Silently fail - localStorage may be disabled
  }

  return null;
}

/**
 * Save theme to localStorage
 */
export function saveThemeToStorage(theme: Theme): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch (e) {
    // Silently fail - localStorage may be disabled or full
    return false;
  }
}

/**
 * Get system preference for theme
 */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Apply theme to document
 */
export function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;

  const html = document.documentElement;

  html.setAttribute("data-theme", theme);

  const isDark = /dark$/.test(theme);
  if (isDark) html.classList.add("dark");
  else html.classList.remove("dark");

  if (theme.startsWith("high-contrast")) html.classList.add("high-contrast");
  else html.classList.remove("high-contrast");

  const shouldApplyCustom = theme.startsWith("custom-");
  if (shouldApplyCustom) {
    try {
      const raw = localStorage.getItem(THEME_CUSTOM_STORAGE_KEY);
      if (raw) {
        const custom = JSON.parse(raw) as { primary?: string; ring?: string };
        if (custom?.primary) html.style.setProperty("--primary", String(custom.primary));
        if (custom?.ring) html.style.setProperty("--ring", String(custom.ring));
      }
    } catch {
      // Ignore malformed custom settings.
    }
  } else {
    html.style.removeProperty("--primary");
    html.style.removeProperty("--ring");
  }
}

/**
 * Initialize theme on app startup
 * Priority: localStorage > system preference > default (light)
 */
export function initializeTheme(): Theme {
  // Check localStorage first
  const stored = getStoredTheme();
  if (stored) {
    applyThemeToDocument(stored);
    return stored;
  }

  // Fall back to system preference
  const systemTheme = getSystemTheme();
  applyThemeToDocument(systemTheme);
  saveThemeToStorage(systemTheme);
  return systemTheme;
}

/**
 * Set theme and persist it
 */
export function setTheme(theme: Theme): void {
  applyThemeToDocument(theme);
  saveThemeToStorage(theme);
  notifyThemeChange(theme);
}
