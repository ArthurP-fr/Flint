import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

import LanguageSwitcher from "../../components/LanguageSwitcher";
import { routing, type AppLocale } from "../../i18n/routing";
import enMessages from "../../messages/en.json";
import frMessages from "../../messages/fr.json";
import "../globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "700"],
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

const metadataByLocale: Record<AppLocale, { title: string; description: string }> = {
  en: enMessages.metadata,
  fr: frMessages.metadata,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: candidateLocale } = await params;
  const locale = hasLocale(routing.locales, candidateLocale)
    ? candidateLocale
    : routing.defaultLocale;
  const metadata = metadataByLocale[locale];

  const languages = routing.locales.reduce<Record<string, string>>(
    (accumulator, currentLocale) => {
      accumulator[currentLocale] = `/${currentLocale}`;
      return accumulator;
    },
    {},
  );

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `/${locale}`,
      languages,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${headingFont.variable} ${monoFont.variable}`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="locale-switcher-shell">
            <LanguageSwitcher />
          </div>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
