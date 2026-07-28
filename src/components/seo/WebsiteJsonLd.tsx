import { getLocale, getTranslations } from "next-intl/server";
import { getSiteUrl } from "@/lib/site-url";

export async function WebsiteJsonLd() {
  const siteUrl = getSiteUrl();
  const locale = await getLocale();
  const t = await getTranslations("Seo");
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Midora",
    url: siteUrl,
    description: t("websiteDescription"),
    inLanguage: locale === "en" ? "en-GB" : "el-GR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/listings?city={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
