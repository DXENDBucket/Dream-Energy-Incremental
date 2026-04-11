import { createI18n } from "vue-i18n";
import en from "./locales/en";
import zhCN from "./locales/zh-CN";

export type AppLocale = "en" | "zh-CN";

const STORAGE_KEY = "dream-energy-incremental.locale";

function getInitialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "zh-CN") return saved;
  return "en";
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "en",
  messages: {
    en,
    "zh-CN": zhCN,
  },
});

export function setAppLocale(locale: AppLocale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
}

export function getAppLocale(): AppLocale {
  return i18n.global.locale.value === "zh-CN" ? "zh-CN" : "en";
}