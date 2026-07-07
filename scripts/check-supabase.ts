/**
 * Verify Supabase connection and schema.
 * Run: npm run db:check
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // ignore
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exitCode = 1;
  throw new Error(msg);
}

function ok(msg: string) {
  console.log(`✅ ${msg}`);
}

async function testRest(url: string, key: string, label: string) {
  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/listings?select=id&limit=1`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  const body = await res.text();

  if (res.status === 401 || res.status === 403) {
    fail(
      `${label}: Λάθος API key (HTTP ${res.status}). Πήγαινε Supabase → API Keys → tab "Legacy API keys" και βάλε τα eyJ... keys.`
    );
  }

  if (res.status === 404 || body.includes("does not exist") || body.includes("42P01")) {
    fail(
      'Πίνακας "listings" δεν υπάρχει — τρέξε το supabase/schema.sql στο SQL Editor'
    );
  }

  if (!res.ok) {
    fail(`${label}: HTTP ${res.status} — ${body.slice(0, 200)}`);
  }

  ok(`${label} → listings table OK`);
}

async function main() {
  console.log("\n🔍 Midora — Supabase Check\n");

  if (!url) fail("NEXT_PUBLIC_SUPABASE_URL λείπει από .env.local");
  if (!anonKey) fail("NEXT_PUBLIC_SUPABASE_ANON_KEY λείπει από .env.local");
  ok("Env keys found");

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    fail("Το URL πρέπει να είναι https://xxxxx.supabase.co");
  }

  console.log(`   URL: ${url}`);
  console.log(`   Publishable key length: ${anonKey.length} chars`);
  if (serviceKey) console.log(`   Secret key length: ${serviceKey.length} chars`);

  await testRest(url, anonKey, "Publishable/anon key");

  if (!serviceKey) {
    console.log("\n⚠️  SUPABASE_SERVICE_ROLE_KEY λείπει (χρειάζεται για seed)");
    return;
  }

  await testRest(url, serviceKey, "Secret/service key");

  const countRes = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/listings?select=id&status=eq.approved`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "count=exact",
      },
    }
  );
  const countHeader = countRes.headers.get("content-range");
  const total = countHeader?.split("/")[1] ?? "?";
  ok(`Βάση: ${total} εγκεκριμένα ακίνητα`);

  const favRes = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/favorites?select=id&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const favBody = await favRes.text();
  if (
    !favRes.ok &&
    (favBody.includes("Could not find the table") || favBody.includes("42P01"))
  ) {
    console.log("\n⚠️  Πίνακας favorites λείπει — τρέξε: npm run db:migrate-favorites");
  } else if (favRes.ok) {
    ok("Πίνακας favorites OK");
  }

  const imgMetaRes = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/listing_images?select=file_name&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  const imgMetaBody = await imgMetaRes.text();
  if (
    !imgMetaRes.ok &&
    imgMetaBody.includes("Could not find") &&
    imgMetaBody.includes("file_name")
  ) {
    console.log(
      "\n⚠️  Στήλες metadata στο listing_images λείπουν — τρέξε: npm run db:migrate-listing-images"
    );
  } else if (imgMetaRes.ok) {
    ok("Πίνακας listing_images metadata OK");
  }

  console.log(`
📋 Επόμενα βήματα:
  npm run db:seed
  npm run dev
  → http://localhost:3000/listings
`);
}

main().catch(() => {
  // exitCode already set in fail()
});
