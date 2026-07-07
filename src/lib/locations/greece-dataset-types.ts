export type GreeceLocationType =
  | "region"
  | "regional_unit"
  | "municipality"
  | "city"
  | "town"
  | "settlement"
  | "neighborhood"
  | "island";

export type GreeceLocationRecord = {
  id: string;
  nameEl: string;
  normalizedName: string;
  locationType: GreeceLocationType;
  regionName?: string;
  municipalityName?: string;
  parentCity?: string;
  area?: string;
  district?: string;
  aliases: string[];
};
