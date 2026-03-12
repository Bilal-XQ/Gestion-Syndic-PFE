import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Syne,
  DM_Sans,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { rtlLocales, type Locale } from "@/i18n/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Syndic — Gestion de Copropriété",
  description:
    "Application de gestion de copropriété pour syndics et copropriétaires.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRtl = rtlLocales.includes(locale as Locale);
  const dir = isRtl ? "rtl" : "ltr";

  const fontClasses = [
    geistSans.variable,
    geistMono.variable,
    instrumentSerif.variable,
    syne.variable,
    dmSans.variable,
    locale === "ar" ? ibmPlexArabic.variable : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${fontClasses} antialiased${locale === "ar" ? " font-[family-name:var(--font-ibm-plex-arabic)]" : ""}`}
      >
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <QueryProvider>
              {children}
              <Toaster
                richColors
                position={isRtl ? "bottom-left" : "bottom-right"}
              />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
