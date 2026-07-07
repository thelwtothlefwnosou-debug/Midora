import { getSiteUrl } from "@/lib/site-url";

export function WebsiteJsonLd() {
  const siteUrl = getSiteUrl();
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Midora",
    url: siteUrl,
    description:
      "Αγγελίες ακινήτων για βραχυχρόνια και μηνιαία/μεσοπρόθεσμη μίσθωση στην Ελλάδα.",
    inLanguage: "el-GR",
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
