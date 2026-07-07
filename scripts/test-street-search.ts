import { searchStreetsInCity } from "../src/lib/geocoding/nominatim";

async function main() {
  const queries = ["κ", "κορο", "κοροξενης", "Κοροζένης"];
  for (const q of queries) {
    const results = await searchStreetsInCity(q, "Πτολεμαΐδα", 5, { fast: true });
    console.log(`\n"${q}" → ${results.length} results`);
    for (const r of results) {
      console.log(`  - ${r.street} (${r.lat}, ${r.lng})`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
