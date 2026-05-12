export type ThemePreference = 'light' | 'dark';

const preferencesState: { theme: ThemePreference } = {
  theme: 'light',
};

export function getThemePreference(): ThemePreference {
  return preferencesState.theme;
}

export function toggleThemePreference(): ThemePreference {
  preferencesState.theme = preferencesState.theme === 'light' ? 'dark' : 'light';
  return preferencesState.theme;
}
