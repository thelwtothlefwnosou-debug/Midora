import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { loadEnv } from "./db-env";
import { MAINLAND_SPIOGATOS_AREAS } from "./spitogatos/mainland-areas";
import { normalizeSpitogatosBatch } from "./spitogatos/normalize";
import type { SpitogatosRawListing } from "./spitogatos/types";
import { TARGET_LISTING_COUNT } from "./spitogatos/types";

const APIFY_ACTOR = "logiover~spitogatos-gr-real-estate-scraper-greece-properties-data";
const DEFAULT_OUT = resolve(process.cwd(), "data/spitogatos/listings.json");

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit?.slice(flag.length + 1);
}

async function fetchViaApify(token: string, maxListings: number): Promise<SpitogatosRawListing[]> {
  const areaIDs = MAINLAND_SPIOGATOS_AREAS.map((a) => a.areaId);
  const body = {
    areaIDs,
    listingType: "rent",
    category: "residential",
    language: "el",
    maxListings,
    maxOffsetPerTask: 80,
    offsetIncrement: 50,
    sortBy: "rankingscore",
    sortOrder: "desc",
    requestDelay: 2000,
    maxRetries: 3,
    proxyConfiguration: {
      useApifyProxy: true,
      apifyProxyGroups: ["RESIDENTIAL"],
    },
  };

  console.log(`⏳ Apify: αναζήτηση έως ${maxListings} αγγελίες σε ${areaIDs.length} περιοχές ηπειρωτικής Ελλάδας...`);
  console.log("   (μπορεί να πάρει 10–30 λεπτά)\n");

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=3600`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Apify HTTP ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as SpitogatosRawListing[];
  return Array.isArray(data) ? data : [];
}

async function main() {
  loadEnv();

  const outPath = resolve(process.cwd(), argValue("--out") ?? DEFAULT_OUT);
  const limit = parseInt(argValue("--limit") ?? String(TARGET_LISTING_COUNT), 10);
  const fromJson = argValue("--from-json");

  let raw: SpitogatosRawListing[] = [];

  if (fromJson) {
    const path = resolve(process.cwd(), fromJson);
    if (!existsSync(path)) {
      console.error(`❌ Δεν βρέθηκε αρχείο: ${path}`);
      process.exit(1);
    }
    raw = JSON.parse(readFileSync(path, "utf-8")) as SpitogatosRawListing[];
    console.log(`📂 Φόρτωση ${raw.length} raw αγγελιών από ${path}`);
  } else {
    const token = process.env.APIFY_TOKEN?.trim();
    if (!token) {
      console.error(`
❌ Λείπει APIFY_TOKEN στο .env.local

Το Spitogatos έχει bot protection — χρειάζεται Apify actor για πραγματικές αγγελίες.

1. Δημιούργησε token στο https://console.apify.com/account/integrations
2. Πρόσθεσε στο .env.local:
   APIFY_TOKEN=apify_api_...

3. Τρέξε ξανά:
   npm run db:fetch-spitogatos

Εναλλακτικά, αν έχεις ήδη JSON export:
   npm run db:fetch-spitogatos -- --from-json=data/spitogatos/raw-export.json
`);
      process.exit(1);
    }
    raw = await fetchViaApify(token, Math.max(limit * 2, 400));
  }

  const normalized = normalizeSpitogatosBatch(raw).slice(0, limit);
  const withAma = normalized.filter((l) => l.withAma).length;
  const withoutAma = normalized.length - withAma;

  mkdirSync(resolve(outPath, ".."), { recursive: true });
  writeFileSync(outPath, JSON.stringify(normalized, null, 2), "utf-8");

  console.log(`\n✅ Αποθηκεύτηκαν ${normalized.length} αγγελίες → ${outPath}`);
  console.log(`   Με ΑΜΑ: ${withAma} | Χωρίς ΑΜΑ: ${withoutAma}`);
  console.log(`   Νησιά: αποκλείονται αυτόματα`);
  console.log(`\nΕπόμενο βήμα: npm run db:import-spitogatos\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
