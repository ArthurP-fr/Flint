"use client";

import { useState, useTransition } from "react";
import { useLocale } from "next-intl";

import { useT } from "../i18n/client";
import { usePathname, useRouter } from "../i18n/navigation";
import { routing, type AppLocale } from "../i18n/routing";

// Exemple: tu mets tes SVG ici (ou import depuis /public)
const flags: Record<AppLocale, string> = {
  fr: "/flags/fr.svg",
  en: "/flags/en.svg",
  es: "/flags/es.svg",
  de: "/flags/de.svg",
  ja: "/flags/ja.svg",
  pt: "/flags/pt.svg",
  ru: "/flags/ru.svg",
  it: "/flags/it.svg",
  nl: "/flags/nl.svg",
  pl: "/flags/pl.svg",
  zh: "/flags/zh.svg",
  hi: "/flags/hi.svg",
  ar: "/flags/ar.svg",
  bn: "/flags/bn.svg",
  id: "/flags/id.svg",
  tr: "/flags/tr.svg",
};

export default function LanguageSwitcher() {
  const t = useT();
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const changeLocale = (next: AppLocale) => {
    if (next === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: next });
    });

    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className="
          flex items-center gap-2
          rounded-xl px-3 py-2
          bg-[#0b1b3a] hover:bg-[#10264d]
          text-gray-200
          border border-[#1f3b66]
          transition
        "
      >
        <img src={flags[locale]} className="w-5 h-5" />
        <span className="text-sm font-semibold">{locale.toUpperCase()}</span>
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute mt-2 w-48
            max-h-56 overflow-y-auto
            rounded-xl
            bg-[#0b1b3a]
            border border-[#1f3b66]
            shadow-lg
            z-50
          "
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              onClick={() => changeLocale(l)}
              className="
                flex w-full items-center gap-3
                px-3 py-2
                text-gray-200
                hover:bg-[#132b55]
                transition
              "
            >
              <img src={flags[l]} className="w-5 h-5" />
              <span className="text-sm">
                {t(`localeSwitcher.locales.${l}`)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
