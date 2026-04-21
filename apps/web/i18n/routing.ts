import { defineRouting } from "next-intl/routing";

export const APP_LOCALES = [
  "en",
  "es",
  "de",
  "ja",
  "fr",
  "pt",
  "ru",
  "it",
  "nl",
  "pl",
  "zh",
  "hi",
  "ar",
  "bn",
  "id",
  "tr",
] as const;

export const RTL_LOCALES = ["ar"] as const;

export const routing = defineRouting({
  locales: [...APP_LOCALES],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];