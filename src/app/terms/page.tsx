import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.terms");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TermsPage() {
  const t = await getTranslations("Legal.terms");
  const tLegal = await getTranslations("Legal");
  const tShared = await getTranslations("Legal.shared");
  const damagesParagraphs = tShared("termsDamages").split("\n\n");

  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow={tLegal("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <LegalSection id="role" title={t("roleTitle")}>
        <p>{tShared("roleFull")}</p>
        <p>{t("roleP2")}</p>
      </LegalSection>

      <LegalSection title={t("accountsTitle")}>
        <p>{t("accountsP1")}</p>
        <p>{t("accountsP2")}</p>
      </LegalSection>

      <LegalSection title={t("listingsTitle")}>
        <p>{t("listingsP1")}</p>
        <p>{t("listingsP2")}</p>
        <p>
          {t("listingsRulesPrefix")}{" "}
          <a href="/listing-rules" className="text-gold hover:underline">
            {t("listingsRulesLink")}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title={t("contactTitle")}>
        <p>{t("contactP1")}</p>
        <p>{t("contactP2")}</p>
      </LegalSection>

      <LegalSection title={t("paymentsTitle")}>
        <p>{tShared("termsPayments")}</p>
      </LegalSection>

      <LegalSection title={t("damagesTitle")}>
        {damagesParagraphs.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
        <p>{t("damagesP3")}</p>
      </LegalSection>

      <LegalSection title={t("updatesTitle")}>
        <p>{t("updatesP1")}</p>
        <p className="text-xs text-muted">
          {t("lastUpdated")}: {new Date().getFullYear()}
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
