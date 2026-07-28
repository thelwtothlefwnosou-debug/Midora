import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Contact");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("Contact");
  const supportEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@midora.gr";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-2xl px-6">
          <h1 className="font-display text-4xl font-bold text-charcoal">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted">{t("subtitle")}</p>

          <GlassCard className="mt-10 space-y-4 p-8">
            <a
              href={`mailto:${supportEmail}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-sand/50 px-5 py-4 transition-colors hover:border-gold/30"
            >
              <Mail className="h-5 w-5 text-gold" />
              <div>
                <p className="text-sm text-muted">{t("emailLabel")}</p>
                <p className="font-medium text-charcoal">{supportEmail}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-xl border border-border bg-sand/50 px-5 py-4">
              <Phone className="h-5 w-5 text-gold" />
              <div>
                <p className="text-sm text-muted">{t("listingsTitle")}</p>
                <p className="font-medium text-charcoal">{t("listingsText")}</p>
              </div>
            </div>
          </GlassCard>

          <p className="mt-8 text-center text-sm text-muted">
            {t("seeFaqPrefix")}{" "}
            <Link href="/faq" className="text-gold hover:underline">
              {t("faqLink")}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
