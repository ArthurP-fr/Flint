"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { useT } from "../i18n/client";
import { usePathname, useRouter } from "../i18n/navigation";
import { routing, type AppLocale } from "../i18n/routing";

type LocaleLabelKey = `localeSwitcher.locales.${AppLocale}`;

export default function LanguageSwitcher() {
  const t = useT();
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const localeLabels = Object.fromEntries(
    routing.locales.map((availableLocale) => [
      availableLocale,
      t(`localeSwitcher.locales.${availableLocale}` as LocaleLabelKey),
    ]),
  ) as Record<AppLocale, string>;

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return;
    }

    const query = Object.fromEntries(searchParams.entries());

    startTransition(() => {
      router.replace({ pathname, query }, { locale: nextLocale });
    });
  };

  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-subtle)] px-2.5 py-1.5">
      <span className="sr-only">{t("localeSwitcher.label")}</span>
      <select
        aria-label={t("localeSwitcher.label")}
        className="bg-transparent text-xs font-semibold text-[var(--foreground)] focus:outline-none"
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
