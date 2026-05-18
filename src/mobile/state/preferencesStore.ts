export type ThemePreference = 'light' | 'dark' | 'system';

const preferencesState: { theme: ThemePreference } = {
  theme: 'system',
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
  if (preferencesState.theme === 'light') {
    preferencesState.theme = 'dark';
  } else if (preferencesState.theme === 'dark') {
    preferencesState.theme = 'system';
  } else {
    preferencesState.theme = 'light';
  }
  notifyListeners();
  return preferencesState.theme;
}

export function setThemePreference(theme: ThemePreference): ThemePreference {
  preferencesState.theme = theme;
  notifyListeners();
  return preferencesState.theme;
}

export function subscribeThemePreference(listener: ThemePreferenceListener): () => void {
  listeners.add(listener);
  listener(preferencesState.theme);
  return () => listeners.delete(listener);
}
