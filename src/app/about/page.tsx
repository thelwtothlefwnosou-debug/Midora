import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import {
  PublicPageLayout,
  StaticHero,
  StaticSection,
} from "@/components/layout/PublicPageLayout";
import { OwnerListingLink } from "@/components/owners/OwnerListingLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.about");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("Marketing.about");

  return (
    <PublicPageLayout>
      <StaticHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      >
        <Button href="/listings?rentalType=short_term" size="lg">
          {t("ctaSearch")}
        </Button>
        <OwnerListingLink variant="outline" size="lg">
          {t("ctaList")}
        </OwnerListingLink>
      </StaticHero>

      <StaticSection title={t("whatTitle")}>
        <p>{t("whatP1")}</p>
        <p>{t("whatP2")}</p>
      </StaticSection>

      <StaticSection title={t("whoTitle")}>
        <p>{t("whoP1")}</p>
        <p>{t("whoP2")}</p>
      </StaticSection>

      <StaticSection title={t("betterTitle")}>
        <p>{t("betterP1")}</p>
        <p>{t("betterP2")}</p>
      </StaticSection>

      <StaticSection title={t("clarityTitle")}>
        <p>{t("clarityP1")}</p>
        <p>{t("clarityP2")}</p>
      </StaticSection>
    </PublicPageLayout>
  );
}
