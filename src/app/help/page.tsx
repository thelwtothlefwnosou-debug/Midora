import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PublicPageLayout,
  StaticHero,
  FaqAccordion,
} from "@/components/layout/PublicPageLayout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Help");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function HelpPage() {
  const t = await getTranslations("Help");
  const topIds = t.raw("topIds") as string[];
  const topItems = t.raw("topItems") as Record<string, { q: string; a: string }>;

  const faqs = topIds
    .map((id) => topItems[id])
    .filter(Boolean)
    .map((item) => ({ question: item.q, answer: item.a }));

  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="space-y-10 pb-4">
        <section>
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("topTitle")}
          </h2>
          <FaqAccordion items={faqs} />
        </section>

        <section id="report" className="scroll-mt-24 rounded-[1.25rem] bg-[#f7f2ea]/70 px-5 py-5 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("reportTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("reportBody")}</p>
        </section>

        <section id="safety" className="scroll-mt-24 rounded-[1.25rem] bg-white px-5 py-5 ring-1 ring-border/70 sm:px-6">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            {t("safetyTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("safetyBody")}</p>
        </section>
      </div>

      <p className="border-t border-border pt-8 text-center text-sm text-muted">
        {t("noAnswer")}{" "}
        <Link href="/contact" className="text-gold hover:underline">
          {t("contactLink")}
        </Link>
        {" · "}
        <Link href="/faq" className="text-gold hover:underline">
          {t("faqLink")}
        </Link>
      </p>
    </PublicPageLayout>
  );
}
