/**
 * Dark / light theme.
 *
 * The choice lives inside the `scamlens:v1` settings document so Phase 3's
 * settings screen can edit it, and the `dark` class is applied to <html> so
 * Tailwind's `dark:` variants work. The inline script in index.html applies the
 * class before React loads, which is what prevents the flash of light theme.
 */

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, loadState, saveState, type ThemeMode } from '../storage/historyStore';

function readStoredTheme(): ThemeMode {
  try {
    const result = loadState();
    if (result.ok) return result.value.settings.theme;
  } catch {
    // Storage unavailable: fall back to the default.
  }
  return DEFAULT_SETTINGS.theme;
}

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  root.style.colorScheme = mode;
}

/** Read the persisted theme once, before the first paint. */
export function initialTheme(): ThemeMode {
  return readStoredTheme();
}

export interface UseTheme {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export function useTheme(): UseTheme {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    const result = loadState();
    if (result.ok) {
      saveState({ ...result.value, settings: { ...result.value.settings, theme: mode } });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, toggleTheme, setTheme };
}
