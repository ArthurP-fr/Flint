import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { RTL_LOCALES, routing } from "../../i18n/routing";
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
  const t = await getTranslations({ locale, namespace: "metadata" });

  const languages = routing.locales.reduce<Record<string, string>>(
    (accumulator, currentLocale) => {
      accumulator[currentLocale] = `/${currentLocale}`;
      return accumulator;
    },
    {},
  );

  return {
    title: t("title"),
    description: t("description"),
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
  const direction = RTL_LOCALES.includes(locale as (typeof RTL_LOCALES)[number]) ? "rtl" : "ltr";

  return (
    <html dir={direction} lang={locale}>
      <body className={`${headingFont.variable} ${monoFont.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
