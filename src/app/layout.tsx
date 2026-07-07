import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import { AiAssistant } from "@/components/ai/AiAssistant";
import { ToastHost } from "@/components/ui/ToastHost";
import { PendingFavoriteSync } from "@/components/favorites/PendingFavoriteSync";
import { WebsiteJsonLd } from "@/components/seo/WebsiteJsonLd";
import { getSiteUrl } from "@/lib/site-url";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const siteUrl = getSiteUrl();

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
});

const cormorantBrand = Cormorant_Garamond({
  variable: "--font-cormorant-brand",
  subsets: ["latin", "latin-ext"],
  weight: ["600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Midora — Αγγελίες ακινήτων στην Ελλάδα",
    template: "%s | Midora",
  },
  description:
    "Αγγελίες για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη μίσθωση — όλη η Ελλάδα.",
  keywords: ["ενοίκιο", "Ελλάδα", "διαμονή", "αγγελίες", "μίσθωση"],
  openGraph: {
    type: "website",
    locale: "el_GR",
    siteName: "Midora",
    title: "Midora — Αγγελίες ακινήτων",
    description:
      "Αναζήτησε ή ανέβασε αγγελία για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη μίσθωση στην Ελλάδα.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "Midora — Αγγελίες ακινήτων",
    description:
      "Αναζήτησε ή ανέβασε αγγελία για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη μίσθωση στην Ελλάδα.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className={`${playfair.variable} ${inter.variable} ${cormorantBrand.variable} h-full`}>
      <body className="min-h-full overflow-x-hidden bg-white antialiased text-charcoal">
        <WebsiteJsonLd />
        {children}
        <ToastHost />
        <PendingFavoriteSync />
        <AiAssistant />
      </body>
    </html>
  );
}
