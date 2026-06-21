import { type ReactNode, useLayoutEffect } from "react";
import { useAppShellStore } from "../../app/appShellStore";
import { applyDocumentTheme, writeStoredThemePreference } from "./theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppShellStore((state) => state.theme);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      applyDocumentTheme(theme);
      writeStoredThemePreference(theme);
    };

    apply();

    if (theme !== "system") {
      return;
    }

    mediaQuery.addEventListener("change", apply);
    return () => mediaQuery.removeEventListener("change", apply);
  }, [theme]);

  return children;
}

