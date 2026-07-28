import { pickLocale } from "@/lib/locale-fallbacks";

import { searchDurationLabel } from "@/lib/duration-ranges";



export type SavedSearchFilters = Record<string, string>;



export function filtersToSearchParams(filters: SavedSearchFilters): string {

  const p = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {

    if (value?.trim()) p.set(key, value.trim());

  }

  return p.toString();

}



export function searchParamsToFilters(params: URLSearchParams | SavedSearchFilters): SavedSearchFilters {

  if (params instanceof URLSearchParams) {

    const out: SavedSearchFilters = {};

    params.forEach((value, key) => {

      out[key] = value;

    });

    return out;

  }

  return params;

}



type SavedSearchNameT = (

  key: string,

  values?: Record<string, string | number>

) => string;



export function buildSavedSearchName(

  filters: SavedSearchFilters,

  t?: SavedSearchNameT,

  durationLabelFn?: (duration: string) => string,

  locale?: string

): string {

  const parts: string[] = [];



  if (filters.polygon) {

    parts.push(t ? t("mapArea") : pickLocale(locale, "περιοχή στον χάρτη", "map area"));

  }

  if (filters.district) parts.push(decodeURIComponent(filters.district));

  if (filters.area) parts.push(decodeURIComponent(filters.area));

  if (filters.city) parts.push(decodeURIComponent(filters.city));

  if (filters.maxPrice) {

    parts.push(

      t

        ? t("upToPrice", { price: filters.maxPrice })

        : pickLocale(locale, `έως €${filters.maxPrice}`, `up to €${filters.maxPrice}`)

    );

  }

  if (filters.minPrice) {

    parts.push(

      t

        ? t("fromPrice", { price: filters.minPrice })

        : pickLocale(locale, `από €${filters.minPrice}`, `from €${filters.minPrice}`)

    );

  }

  if (filters.bedrooms) {

    parts.push(

      t

        ? t("bedrooms", { count: filters.bedrooms })

        : pickLocale(locale, `${filters.bedrooms} υ/δ`, `${filters.bedrooms} bd`)

    );

  }

  if (filters.moveIn) {

    parts.push(

      t

        ? t("fromMonth", { month: decodeURIComponent(filters.moveIn) })

        : pickLocale(

            locale,

            `από ${decodeURIComponent(filters.moveIn)}`,

            `from ${decodeURIComponent(filters.moveIn)}`

          )

    );

  }

  if (filters.duration) {

    parts.push(

      durationLabelFn

        ? durationLabelFn(filters.duration)

        : searchDurationLabel(filters.duration)

    );

  } else if (filters.minMonths) {

    parts.push(

      t

        ? t("months", { count: filters.minMonths })

        : pickLocale(locale, `${filters.minMonths} μήνες`, `${filters.minMonths} months`)

    );

  }

  if (filters.furnished === "true") {

    parts.push(t ? t("furnished") : pickLocale(locale, "επιπλωμένα", "furnished"));

  }

  if (filters.parking === "true") {

    parts.push(t ? t("withParking") : pickLocale(locale, "με parking", "with parking"));

  }

  if (filters.pets === "true") {

    parts.push(t ? t("withPets") : pickLocale(locale, "με κατοικίδια", "pet-friendly"));

  }

  if (filters.bills === "true") {

    parts.push(

      t

        ? t("billsIncluded")

        : pickLocale(locale, "λογαριασμοί περιλαμβάνονται", "bills included")

    );

  }



  return parts.length

    ? parts.join(" · ")

    : t

      ? t("defaultName")

      : pickLocale(locale, "Η αναζήτησή μου", "My search");

}



export function savedSearchToUrl(filters: SavedSearchFilters): string {

  const qs = filtersToSearchParams(filters);

  return qs ? `/listings?${qs}` : "/listings";

}


