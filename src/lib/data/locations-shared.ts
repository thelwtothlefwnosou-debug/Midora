export type SearchLocationKind = "city" | "district" | "area" | "nearby";

export type SearchLocation = {
  label: string;
  city: string;
  area?: string;
  district?: string;
  region?: string;
  rank: number;
  aliases: string[];
  kind: SearchLocationKind;
};

export const MIN_LOCATION_QUERY_LENGTH = 1;
export const MAX_LOCATION_SUGGESTIONS = 8;

export const NEARBY_LOCATION: SearchLocation = {
  label: "Σε κοντινή απόσταση",
  city: "",
  kind: "nearby",
  rank: 0,
  aliases: ["κοντα", "nearby", "gps"],
};

export function formatLocationSelection(loc: SearchLocation): string {
  if (loc.kind === "nearby") return loc.label;
  if (loc.area && loc.kind === "area") return loc.area;
  if (loc.district && loc.district !== loc.city && loc.kind === "district") {
    return loc.district;
  }
  return loc.city || loc.label;
}
