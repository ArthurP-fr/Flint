import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing, type AppLocale } from "./routing";

type Messages = Record<string, unknown>;

const messageLoaders: Record<AppLocale, () => Promise<Messages>> = {
  en: async () => (await import("../locales/en.json")).default as Messages,
  es: async () => (await import("../locales/es.json")).default as Messages,
  de: async () => (await import("../locales/de.json")).default as Messages,
  ja: async () => (await import("../locales/ja.json")).default as Messages,
  fr: async () => (await import("../locales/fr.json")).default as Messages,
  pt: async () => (await import("../locales/pt.json")).default as Messages,
  ru: async () => (await import("../locales/ru.json")).default as Messages,
  it: async () => (await import("../locales/it.json")).default as Messages,
  nl: async () => (await import("../locales/nl.json")).default as Messages,
  pl: async () => (await import("../locales/pl.json")).default as Messages,
  zh: async () => (await import("../locales/zh.json")).default as Messages,
  hi: async () => (await import("../locales/hi.json")).default as Messages,
  ar: async () => (await import("../locales/ar.json")).default as Messages,
  bn: async () => (await import("../locales/bn.json")).default as Messages,
  id: async () => (await import("../locales/id.json")).default as Messages,
  tr: async () => (await import("../locales/tr.json")).default as Messages,
};

const isObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

const mergeMessages = (base: Messages, override: Messages): Messages => {
  const merged: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];

    if (isObject(current) && isObject(value)) {
      merged[key] = mergeMessages(current, value);
      continue;
    }

    merged[key] = value;
  }

  return merged;
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  const defaultMessages = await messageLoaders[routing.defaultLocale]();
  const localeMessages = await messageLoaders[locale]();

  return {
    locale,
    messages:
      locale === routing.defaultLocale
        ? defaultMessages
        : mergeMessages(defaultMessages, localeMessages),
  };
});
