#!/usr/bin/env npx tsx
/**
 * Seed Greece locations into Supabase from the in-app dataset.
 * Run: npx tsx scripts/seed-locations.ts
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient } from "@supabase/supabase-js";
import { GREECE_LOCATION_DATASET } from "../src/lib/locations/greece-dataset";
import { normalizeLocationQuery } from "../src/lib/locations/normalize";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log(`Seeding ${GREECE_LOCATION_DATASET.length} locations...`);

  const cityIdByName = new Map<string, string>();
  let inserted = 0;
  let aliasesInserted = 0;

  const cities = GREECE_LOCATION_DATASET.filter(
    (l) => l.locationType !== "neighborhood"
  );
  const neighborhoods = GREECE_LOCATION_DATASET.filter(
    (l) => l.locationType === "neighborhood"
  );

  for (const loc of cities) {
    const { data, error } = await supabase
      .from("locations")
      .upsert(
        {
          name_el: loc.nameEl,
          normalized_name: loc.normalizedName,
          location_type: loc.locationType,
          region_name: loc.regionName ?? null,
          municipality_name: loc.municipalityName ?? null,
          is_active: true,
        },
        { onConflict: "normalized_name,location_type", ignoreDuplicates: false }
      )
      .select("id")
      .single();

    if (error) {
      const { data: existing } = await supabase
        .from("locations")
        .select("id")
        .eq("normalized_name", loc.normalizedName)
        .eq("location_type", loc.locationType)
        .maybeSingle();
      if (existing?.id) {
        cityIdByName.set(`${loc.locationType}:${loc.nameEl}`, existing.id);
        continue;
      }
      console.warn(`Skip ${loc.nameEl}:`, error.message);
      continue;
    }

    cityIdByName.set(`${loc.locationType}:${loc.nameEl}`, data.id);
    inserted++;

    for (const alias of loc.aliases) {
      const normalized = normalizeLocationQuery(alias);
      if (!normalized || normalized === loc.normalizedName) continue;
      const { error: aliasErr } = await supabase.from("location_aliases").upsert(
        {
          location_id: data.id,
          alias,
          normalized_alias: normalized,
          language: /^[a-z\s]+$/i.test(alias) ? "en" : "el",
        },
        { onConflict: "location_id,normalized_alias", ignoreDuplicates: true }
      );
      if (!aliasErr) aliasesInserted++;
    }
  }

  for (const loc of neighborhoods) {
    const parentKey = `city:${loc.parentCity}`;
    let parentId = cityIdByName.get(parentKey);
    if (!parentId && loc.parentCity) {
      const { data: parent } = await supabase
        .from("locations")
        .select("id")
        .eq("normalized_name", normalizeLocationQuery(loc.parentCity))
        .eq("location_type", "city")
        .maybeSingle();
      parentId = parent?.id;
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name_el: loc.nameEl,
        normalized_name: loc.normalizedName,
        location_type: loc.locationType,
        parent_id: parentId ?? null,
        region_name: loc.regionName ?? null,
        municipality_name: loc.municipalityName ?? loc.district ?? null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) {
      continue;
    }
    inserted++;

    for (const alias of loc.aliases) {
      const normalized = normalizeLocationQuery(alias);
      if (!normalized || normalized === loc.normalizedName) continue;
      await supabase.from("location_aliases").insert({
        location_id: data.id,
        alias,
        normalized_alias: normalized,
      });
      aliasesInserted++;
    }
  }

  console.log(`Done. Locations upserted/inserted: ${inserted}, aliases: ${aliasesInserted}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
