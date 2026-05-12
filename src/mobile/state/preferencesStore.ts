export type ThemePreference = 'light' | 'dark';

const preferencesState: { theme: ThemePreference } = {
  theme: 'light',
};

type ThemePreferenceListener = (theme: ThemePreference) => void;

const listeners = new Set<ThemePreferenceListener>();

function notifyListeners(): void {
  listeners.forEach((listener) => listener(preferencesState.theme));
}

export function getThemePreference(): ThemePreference {
  return preferencesState.theme;
}

export function toggleThemePreference(): ThemePreference {
  preferencesState.theme = preferencesState.theme === 'light' ? 'dark' : 'light';
  notifyListeners();
  return preferencesState.theme;
}

export function subscribeThemePreference(listener: ThemePreferenceListener): () => void {
  listeners.add(listener);
  listener(preferencesState.theme);
  return () => listeners.delete(listener);
}
