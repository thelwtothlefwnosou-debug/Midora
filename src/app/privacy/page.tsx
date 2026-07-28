import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  PublicPageLayout,
  StaticHero,
  LegalSection,
} from "@/components/layout/PublicPageLayout";

const supportEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@midora.gr";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Legal.privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal.privacy");
  const tLegal = await getTranslations("Legal");
  const tShared = await getTranslations("Legal.shared");

  return (
    <PublicPageLayout narrow>
      <StaticHero
        eyebrow={tLegal("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <LegalSection title={t("dataTitle")}>
        <p>{t("dataP1")}</p>
      </LegalSection>

      <LegalSection title={t("addressTitle")}>
        <p>{t("addressP1")}</p>
        <p>{t("addressP2")}</p>
      </LegalSection>

      <LegalSection title={t("messagesTitle")}>
        <p>{tShared("privacyMessages")}</p>
      </LegalSection>

      <LegalSection title={t("useTitle")}>
        <p>{t("useP1")}</p>
        <p>{t("useP2")}</p>
      </LegalSection>

      <LegalSection title={t("accountTitle")}>
        <p>{t("accountP1")}</p>
      </LegalSection>

      <LegalSection id="cookies" title={t("cookiesTitle")}>
        <p>{t("cookiesP1")}</p>
      </LegalSection>

      <LegalSection id="security" title={t("securityTitle")}>
        <p>{t("securityP1")}</p>
      </LegalSection>

      <LegalSection title={t("contactTitle")}>
        <p>
          {t.rich("contactP1", {
            email: supportEmail,
            mailto: (chunks) => (
              <a
                href={`mailto:${supportEmail}`}
                className="text-gold hover:underline"
              >
                {chunks}
              </a>
            ),
            contactLink: (chunks) => (
              <Link href="/contact" className="text-gold hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p className="text-xs text-muted">
          {t("lastUpdated")}: {new Date().getFullYear()}
        </p>
      </LegalSection>
    </PublicPageLayout>
  );
}
