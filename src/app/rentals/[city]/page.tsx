import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  PublicPageLayout,
  StaticHero,
  StaticSection,
  FaqAccordion,
} from "@/components/layout/PublicPageLayout";
import {
  CITY_LANDING_SLUGS,
  CITY_LANDINGS,
  citySearchHref,
  getCityLanding,
} from "@/lib/data/city-landings";

type Props = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return CITY_LANDING_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityLanding(slug);
  if (!city) return { title: "Μηνιαίες ενοικιάσεις" };

  return {
    title: `Μηνιαίες ενοικιάσεις ${city.nameIn}`,
    description: city.intro,
  };
}

export default async function CityRentalsPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityLanding(slug);
  if (!city) notFound();

  const otherCities = CITY_LANDING_SLUGS.filter((s) => s !== slug).map(
    (s) => CITY_LANDINGS[s]
  );

  return (
    <PublicPageLayout>
      <StaticHero
        eyebrow="Μηνιαίες ενοικιάσεις"
        title={`Μηνιαίες ενοικιάσεις ${city.nameIn}`}
        subtitle={city.intro}
      >
        <Button href={citySearchHref(city.searchCity)} size="lg">
          Δες διαθέσιμα ακίνητα
        </Button>
        <Button href="/how-it-works" variant="outline" size="lg">
          Πώς λειτουργεί
        </Button>
      </StaticHero>

      <StaticSection title="Για ποιους είναι">
        <ul className="list-disc space-y-2 pl-5">
          {city.audience.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </StaticSection>

      <StaticSection title="Συχνές ερωτήσεις">
        <FaqAccordion items={city.faq} />
      </StaticSection>

      <StaticSection title="Άλλες πόλεις" className="border-t border-border">
        <p className="text-sm text-muted">
          Εξερεύνησε μηνιαίες ενοικιάσεις και σε άλλες πόλεις:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {otherCities.map((other) => (
            <Link
              key={other.slug}
              href={`/rentals/${other.slug}`}
              className="rounded-full border border-border bg-white px-4 py-2 text-sm text-charcoal transition-colors hover:border-gold/40 hover:text-gold-dark"
            >
              {other.name}
            </Link>
          ))}
        </div>
      </StaticSection>
    </PublicPageLayout>
  );
}
