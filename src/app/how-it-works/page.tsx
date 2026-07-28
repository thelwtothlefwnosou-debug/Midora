import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import {
  PublicPageLayout,
  StaticHero,
  StaticSection,
  StepList,
} from "@/components/layout/PublicPageLayout";
import { OwnerListingLink } from "@/components/owners/OwnerListingLink";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Marketing.howItWorks");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

const RENTER_STEP_KEYS = [
  { title: "renter1Title", description: "renter1Text" },
  { title: "renter2Title", description: "renter2Text" },
  { title: "renter3Title", description: "renter3Text" },
  { title: "renter4Title", description: "renter4Text" },
] as const;

const OWNER_STEP_KEYS = [
  { title: "owner1Title", description: "owner1Text" },
  { title: "owner2Title", description: "owner2Text" },
  { title: "owner3Title", description: "owner3Text" },
  { title: "owner4Title", description: "owner4Text" },
] as const;

export default async function HowItWorksPage() {
  const t = await getTranslations("Marketing.howItWorks");

  const renterSteps = RENTER_STEP_KEYS.map((keys) => ({
    title: t(keys.title),
    description: t(keys.description),
  }));

  const ownerSteps = OWNER_STEP_KEYS.map((keys) => ({
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
        <Button href="/listings?rentalType=short_term" size="lg">
          {t("ctaSearch")}
        </Button>
        <OwnerListingLink variant="outline" size="lg">
          {t("ctaList")}
        </OwnerListingLink>
      </StaticHero>

      <StaticSection title={t("rentersTitle")}>
        <p>{t("rentersIntro")}</p>
        <StepList steps={renterSteps} />
      </StaticSection>

      <StaticSection title={t("ownersTitle")}>
        <p>{t("ownersIntro")}</p>
        <StepList steps={ownerSteps} />
      </StaticSection>
    </PublicPageLayout>
  );
}
