import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PublicPageLayout,
  StaticHero,
  StaticSection,
  StepList,
} from "@/components/layout/PublicPageLayout";
import { OwnerListingLink } from "@/components/owners/OwnerListingLink";
import type { RentalType } from "@/lib/rental-types";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.owners");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const RENTAL_CARDS: { rentalType: RentalType; titleKey: "cardShortTitle" | "cardMonthlyTitle"; textKey: "cardShortText" | "cardMonthlyText" }[] = [
  { rentalType: "short_term", titleKey: "cardShortTitle", textKey: "cardShortText" },
  { rentalType: "monthly", titleKey: "cardMonthlyTitle", textKey: "cardMonthlyText" },
];

const PROCESS_STEP_KEYS = [
  { title: "step1Title", description: "step1Text" },
  { title: "step2Title", description: "step2Text" },
  { title: "step3Title", description: "step3Text" },
  { title: "step4Title", description: "step4Text" },
] as const;

const GOOD_LISTING_KEYS = ["good1", "good2", "good3", "good4", "good5", "good6"] as const;

export default async function OwnersPage() {
  const t = await getTranslations("Marketing.owners");

  const processSteps = PROCESS_STEP_KEYS.map((keys) => ({
    title: t(keys.title),
    description: t(keys.description),
  }));

  return (
    <PublicPageLayout>
      <StaticHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      >
        <OwnerListingLink size="lg">{t("ctaList")}</OwnerListingLink>
      </StaticHero>

      <StaticSection title={t("typesTitle")}>
        <div className="grid gap-4 sm:grid-cols-3">
          {RENTAL_CARDS.map((card) => (
            <div
              key={card.rentalType}
              className="rounded-xl border border-border bg-white p-5 shadow-soft"
            >
              <h3 className="font-display text-base font-semibold text-charcoal">
                {t(card.titleKey)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(card.textKey)}</p>
            </div>
          ))}
        </div>
      </StaticSection>

      <StaticSection title={t("whyTitle")}>
        <p>{t("whyP1")}</p>
        <p>{t("whyP2")}</p>
      </StaticSection>

      <StaticSection title={t("fitTitle")}>
        <p>{t("fitP1")}</p>
        <p>{t("fitP2")}</p>
      </StaticSection>

      <StaticSection title={t("processTitle")}>
        <StepList steps={processSteps} />
      </StaticSection>

      <StaticSection title={t("goodListingTitle")}>
        <ul className="list-disc space-y-2 pl-5">
          {GOOD_LISTING_KEYS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
        <p className="mt-4">
          {t("seeMorePrefix")}{" "}
          <Link href="/how-it-works" className="text-gold hover:underline">
            {t("seeMoreLink")}
          </Link>
          .
        </p>
      </StaticSection>

      <div className="border-t border-border py-10">
        <OwnerListingLink size="lg">{t("ctaList")}</OwnerListingLink>
      </div>
    </PublicPageLayout>
  );
}
