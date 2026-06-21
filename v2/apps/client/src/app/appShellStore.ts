import { create } from "zustand";
import { readStoredThemePreference, type ThemePreference } from "../shared/theme/theme";
import type { Locale } from "../i18n/messages";

export type AppRoute = "home" | "contacts" | "calendar" | "settings";
export type SettingsSection = "account" | "app" | "shortcuts-data" | "intelligence" | "permissions";

type AppShellState = {
  route: AppRoute;
  settingsSection: SettingsSection;
  welcomeDismissed: boolean;
  theme: ThemePreference;
  locale: Locale;
  setRoute: (route: AppRoute) => void;
  setSettingsSection: (section: SettingsSection) => void;
  dismissWelcome: () => void;
  setTheme: (theme: ThemePreference) => void;
  setLocale: (locale: Locale) => void;
};

export const useAppShellStore = create<AppShellState>((set) => ({
  route: "home",
  settingsSection: "intelligence",
  welcomeDismissed: false,
  theme: readStoredThemePreference(),
  locale: normalizeInitialLocale(),
  setRoute: (route) => set({ route }),
  setSettingsSection: (settingsSection) => set({ settingsSection, route: "settings" }),
  dismissWelcome: () => set({ welcomeDismissed: true }),
  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
}));

function normalizeInitialLocale(): Locale {
  const language = navigator.language.toLowerCase();
  return language.startsWith("zh") ? "zh" : "en";
}
