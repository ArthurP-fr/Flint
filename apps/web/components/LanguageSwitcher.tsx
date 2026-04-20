"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { useT } from "../i18n/client";
import { usePathname, useRouter } from "../i18n/navigation";
import { routing, type AppLocale } from "../i18n/routing";

export default function LanguageSwitcher() {
  const t = useT();
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const localeLabels: Record<AppLocale, string> = {
    en: t("localeSwitcher.locales.en"),
    fr: t("localeSwitcher.locales.fr"),
  };

  const handleLocaleChange = (nextLocale: AppLocale) => {
    const query = Object.fromEntries(searchParams.entries());

    startTransition(() => {
      router.replace({ pathname, query }, { locale: nextLocale });
    });
  };

  return (
    <label className="locale-switcher">
      <span className="sr-only">{t("localeSwitcher.label")}</span>
      <select
        aria-label={t("localeSwitcher.label")}
        disabled={isPending}
        onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
        value={locale}
      >
        {routing.locales.map((availableLocale) => (
          <option key={availableLocale} value={availableLocale}>
            {localeLabels[availableLocale]}
          </option>
        ))}
      </select>
    </label>
  );
}
