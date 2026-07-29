import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { HelpAssistantProvider } from "@/components/assistant/HelpAssistantContext";
import { AiAssistantLazy } from "@/components/ai/AiAssistantLazy";
import { HtmlLangSync } from "@/components/layout/HtmlLangSync";
import { ToastHost } from "@/components/ui/ToastHost";
import { PendingFavoriteSync } from "@/components/favorites/PendingFavoriteSync";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";
import { pickClientMessages } from "@/lib/client-messages";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorantBrand = Cormorant_Garamond({
  variable: "--font-cormorant-brand",
  subsets: ["latin", "latin-ext"],
  weight: ["600"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Site");
  const keywords = t("keywords")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("titleDefault"),
      template: "%s | Midora",
    },
    description: t("description"),
    keywords,
    openGraph: {
      type: "website",
      locale: locale === "el" ? "el_GR" : "en_US",
      siteName: "Midora",
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: siteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  // Public-default bundle: homepage/search stay light. Dashboard/admin nest a fuller provider.
  const messages = pickClientMessages(await getMessages(), "public");

  return (
    <html lang={locale} className={`${playfair.variable} ${inter.variable} ${cormorantBrand.variable} h-full`}>
      <body className="min-h-full overflow-x-hidden bg-white antialiased text-charcoal">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <HtmlLangSync />
          <WebsiteJsonLd />
          <HelpAssistantProvider>
            {children}
            <ToastHost />
            <PendingFavoriteSync />
            <Suspense fallback={null}>
              <AiAssistantLazy />
            </Suspense>
          </HelpAssistantProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
