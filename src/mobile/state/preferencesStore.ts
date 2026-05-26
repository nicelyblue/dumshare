import { setStorageValue, getStorageValue } from '../utils/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'theme_preference';

const preferencesState: { theme: ThemePreference } = {
  theme: 'system',
};

type ThemePreferenceListener = (theme: ThemePreference) => void;

const listeners = new Set<ThemePreferenceListener>();

// Track if preferences have been initialized from storage
let isInitialized = false;

function notifyListeners(): void {
  listeners.forEach((listener) => listener(preferencesState.theme));
}

/**
 * Initialize preferences from storage
 * Should be called on app startup
 */
export async function initializePreferences(): Promise<void> {
  if (isInitialized) return;

  try {
    const stored = await getStorageValue(THEME_STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      preferencesState.theme = stored;
    }
  } catch (error) {
    console.error('Failed to initialize preferences', error);
  }

  isInitialized = true;
  notifyListeners();
}

export function getThemePreference(): ThemePreference {
  return preferencesState.theme;
}

export function toggleThemePreference(): ThemePreference {
  if (preferencesState.theme === 'light') {
    preferencesState.theme = 'dark';
  } else if (preferencesState.theme === 'dark') {
    preferencesState.theme = 'system';
  } else {
    preferencesState.theme = 'light';
  }
  void setStorageValue(THEME_STORAGE_KEY, preferencesState.theme);
  notifyListeners();
  return preferencesState.theme;
}

export function setThemePreference(theme: ThemePreference): ThemePreference {
  preferencesState.theme = theme;
  void setStorageValue(THEME_STORAGE_KEY, theme);
  notifyListeners();
  return preferencesState.theme;
}

export function subscribeThemePreference(listener: ThemePreferenceListener): () => void {
  listeners.add(listener);
  listener(preferencesState.theme);
  return () => listeners.delete(listener);
}
