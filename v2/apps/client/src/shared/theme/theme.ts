export type ThemePreference = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "percent-theme";

export function normalizeThemePreference(value: string | null): ThemePreference {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "system";
}

export function readStoredThemePreference(): ThemePreference {
  try {
    return normalizeThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

export function writeStoredThemePreference(theme: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Local storage can be unavailable in restricted webviews.
  }
}

export function resolveIsDarkMode(theme: ThemePreference, prefersDark: boolean) {
  if (theme === "dark") {
    return true;
  }
  if (theme === "light") {
    return false;
  }
  return prefersDark;
}

export function applyDocumentTheme(theme: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = resolveIsDarkMode(theme, prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.dataset.theme = theme;
}

