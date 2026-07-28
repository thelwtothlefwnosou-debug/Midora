import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

const AADE_URL = "https://www.aade.gr/brahyhronia-misthosi-akiniton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.shortTermGuide");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ShortTermRentalGuidePage() {
  const t = await getTranslations("Legal.shortTermGuide");

  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <LegalSection title={t("whatIsMidoraTitle")}>
        <p>{t("whatIsMidoraBody")}</p>
      </LegalSection>

      <LegalSection title={t("registryTitle")}>
        <p>{t("registryBody")}</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>{t("registryStep1")}</li>
          <li>{t("registryStep2")}</li>
          <li>{t("registryStep3")}</li>
          <li>{t("registryStep4")}</li>
        </ol>
        <p className="mt-3 text-sm text-muted">{t("registryNote")}</p>
        <a
          href={AADE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm font-medium text-gold hover:underline"
        >
          {t("registryOfficialLink")}
        </a>
      </LegalSection>

      <LegalSection title={t("afterSubmitTitle")}>
        <p>{t("afterSubmitBody")}</p>
      </LegalSection>

      <LegalSection title={t("relatedTitle")}>
        <p>
          <Link href="/listing-rules" className="text-gold hover:underline">
            {t("relatedListingRules")}
          </Link>
          {" · "}
          <Link href="/terms" className="text-gold hover:underline">
            {t("relatedTerms")}
          </Link>
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
