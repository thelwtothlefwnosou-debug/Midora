export function buildResultsPageTitle(input: {
  rentalType?: string | null;
  cityLabel?: string | null;
  districtLabel?: string | null;
  nearbySearch?: boolean;
  mapAreaSearch?: boolean;
  boundsSearch?: boolean;
}): { title: string; subtitle: string } {
  const location =
    input.districtLabel ??
    input.cityLabel ??
    (input.nearbySearch
      ? "κοντά στην τοποθεσία σου"
      : input.mapAreaSearch
        ? "στην επιλεγμένη περιοχή"
        : input.boundsSearch
          ? "στην περιοχή του χάρτη"
          : null);

  if (input.rentalType === "short_term") {
    return {
      title: location ? `Βραχυχρόνια διαμονή ${formatLocationIn(location)}` : "Βραχυχρόνια διαμονή",
      subtitle: "",
    };
  }

  if (input.rentalType === "monthly") {
    return {
      title: location
        ? `Μηνιαία / μεσοπρόθεσμη ${formatLocationIn(location)}`
        : "Μηνιαία / μεσοπρόθεσμη μίσθωση",
      subtitle: "",
    };
  }

  return {
    title: location ? `Αγγελίες ${formatLocationIn(location)}` : "Αναζήτηση ακινήτων",
    subtitle: "",
  };
}

function formatLocationIn(location: string): string {
  if (location.startsWith("στη ") || location.startsWith("στο ") || location.startsWith("στην ")) {
    return location;
  }
  return `στην ${location}`;
}

export function buildResultsSubtitle(totalCount: number): string {
  if (totalCount === 0) return "Δεν βρέθηκαν αγγελίες που να ταιριάζουν";
  if (totalCount === 1) return "1 αγγελία που ταιριάζει στην αναζήτησή σου";
  return `${totalCount.toLocaleString("el-GR")} αγγελίες που ταιριάζουν στην αναζήτησή σου`;
}
