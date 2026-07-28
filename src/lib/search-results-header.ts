type TitleInput = {
  rentalType?: string | null;
  cityLabel?: string | null;
  districtLabel?: string | null;
  nearbySearch?: boolean;
  mapAreaSearch?: boolean;
  boundsSearch?: boolean;
};

type Translate = (key: string, values?: Record<string, string | number>) => string;

function resolveLocationLabel(input: TitleInput, t: Translate): string | null {
  if (input.districtLabel) return input.districtLabel;
  if (input.cityLabel) return input.cityLabel;
  if (input.nearbySearch) return t("nearYou");
  if (input.mapAreaSearch) return t("inSelectedArea");
  if (input.boundsSearch) return t("inMapArea");
  return null;
}

function formatLocationIn(location: string, t: Translate): string {
  if (
    location.startsWith("στη ") ||
    location.startsWith("στο ") ||
    location.startsWith("στην ") ||
    location.startsWith("in ") ||
    location.startsWith("near ")
  ) {
    return location;
  }
  return t("inLocation", { location });
}

export function buildResultsPageTitle(
  input: TitleInput,
  t: Translate
): { title: string; subtitle: string } {
  const location = resolveLocationLabel(input, t);
  const place = location ? formatLocationIn(location, t) : null;

  if (input.rentalType === "short_term") {
    return {
      title: place ? t("shortTermIn", { place }) : t("shortTerm"),
      subtitle: "",
    };
  }

  if (input.rentalType === "monthly") {
    return {
      title: place ? t("monthlyIn", { place }) : t("monthly"),
      subtitle: "",
    };
  }

  return {
    title: place ? t("listingsIn", { place }) : t("searchProperties"),
    subtitle: "",
  };
}

export function buildResultsSubtitle(totalCount: number, t: Translate): string {
  if (totalCount === 0) return t("noneMatch");
  if (totalCount === 1) return t("oneMatch");
  return t("nMatch", { count: totalCount.toLocaleString() });
}
