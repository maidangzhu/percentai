import { createContext, type ReactNode, useContext, useEffect, useMemo } from "react";
import { useAppShellStore } from "../app/appShellStore";
import { messages, type Locale, type MessageKey } from "./messages";

type I18nContextValue = {
  locale: Locale;
  t: (key: MessageKey, values?: Record<string, string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAppShellStore((state) => state.locale);
  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      t: (key, values) => interpolate(messages[locale][key] ?? messages.en[key], values),
    }),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}

function interpolate(message: string, values?: Record<string, string>) {
  if (!values) {
    return message;
  }

  return Object.entries(values).reduce(
    (current, [key, value]) => current.split(`{${key}}`).join(value),
    message,
  );
}
