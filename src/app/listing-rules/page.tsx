import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.listingRules");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ListingRulesPage() {
  const t = await getTranslations("Legal.listingRules");

  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <LegalSection title={t("accuracyTitle")}>
        <ul className="list-disc space-y-2 pl-5">
          <li>{t("accuracy1")}</li>
          <li>{t("accuracy2")}</li>
          <li>{t("accuracy3")}</li>
          <li>{t("accuracy4")}</li>
          <li>{t("accuracy5")}</li>
        </ul>
      </LegalSection>

      <LegalSection title={t("registryTitle")}>
        <p>{t("registryP1")}</p>
        <p>{t("registryP2")}</p>
        <p>
          {t("registryP3Prefix")}{" "}
          <Link
            href="/short-term-rental-guide"
            className="text-gold hover:underline"
          >
            {t("registryGuideLink")}
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title={t("reviewTitle")}>
        <p>{t("reviewP1")}</p>
        <p>{t("reviewP2")}</p>
      </LegalSection>

      <LegalSection title={t("relatedTitle")}>
        <p>
          <Link href="/terms" className="text-gold hover:underline">
            {t("termsLink")}
          </Link>
          {" · "}
          <Link href="/privacy" className="text-gold hover:underline">
            {t("privacyLink")}
          </Link>
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
