import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing, type AppLocale } from "./routing";

type Messages = Record<string, unknown>;

const messageLoaders: Record<AppLocale, () => Promise<Messages>> = {
  en: async () => (await import("../messages/en.json")).default as Messages,
  fr: async () => (await import("../messages/fr.json")).default as Messages,
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