/**
 * Seed Supabase with all 65 demo listings.
 *
 * Prerequisites:
 * 1. Run supabase/schema.sql in SQL Editor
 * 2. Add to .env.local:
 *    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 *    SUPABASE_SERVICE_ROLE_KEY=eyJ...  (Settings → API → service_role)
 *
 * Run: npm run db:seed
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { SEED_LISTINGS } from "../src/lib/data/seed-listings";

// Load .env.local manually
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(`
❌ Λείπουν τα Supabase credentials στο .env.local

Πρόσθεσε:
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG...   ← Settings → API → service_role (secret)

Δημιούργησε project στο https://supabase.com/dashboard
Τρέξε πρώτα το supabase/schema.sql στο SQL Editor
`);
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const HOSTS = [
  { name: "Γιώργος Παπαδόπουλος", phone: "+30 697 384 2156" },
  { name: "Μαρία Νικολάου", phone: "+30 694 521 7893" },
  { name: "Νίκος Αντωνίου", phone: "+30 693 847 1205" },
  { name: "Ελένη Δημητρίου", phone: "+30 698 234 5671" },
  { name: "Κώστας Γεωργίου", phone: "+30 697 912 4830" },
  { name: "Σοφία Παπαδοπούλου", phone: "+30 694 678 9012" },
  { name: "Δημήτρης Ιωάννου", phone: "+30 693 156 7842" },
  { name: "Αννα Μιχαηλίδου", phone: "+30 697 445 3218" },
  { name: "Παύλος Κωνσταντίνου", phone: "+30 698 789 0456" },
  { name: "Χριστίνα Βασιλείου", phone: "+30 694 312 6789" },
  { name: "Αλέξανδρος Στεφάνου", phone: "+30 697 567 8901" },
  { name: "Ιωάννα Φωτιάδου", phone: "+30 693 890 1234" },
  { name: "Μιχάλης Οικονόμου", phone: "+30 698 123 4567" },
  { name: "Κατερίνα Αλεξίου", phone: "+30 694 456 7890" },
  { name: "Θανάσης Πέτρου", phone: "+30 697 234 5678" },
];

const hostIds: string[] = [];

async function ensureHosts() {
  console.log("👤 Δημιουργία/έλεγχος hosts...");

  for (let i = 0; i < HOSTS.length; i++) {
    const host = HOSTS[i];
    const email = `midora-host-${i + 1}@midora-demo.local`;

    const { data: existing } = await supabase.auth.admin.listUsers();
    const found = existing?.users?.find((u) => u.email === email);

    if (found) {
      hostIds.push(found.id);
      await supabase.from("profiles").upsert({
        id: found.id,
        full_name: host.name,
        phone: host.phone,
        role: i === 0 ? "admin" : "user",
      });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: `MidoraSeed!${i + 1}${Date.now()}`,
      email_confirm: true,
      user_metadata: { full_name: host.name, phone: host.phone },
    });

    if (error) {
      console.error(`  ✗ Host ${i + 1}:`, error.message);
      continue;
    }

    if (data.user) {
      hostIds.push(data.user.id);
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: host.name,
        phone: host.phone,
        role: i === 0 ? "admin" : "user",
      });
      console.log(`  ✓ Host: ${host.name}`);
    }
  }
}

async function seedListings() {
  console.log(`\n🏠 Seed ${SEED_LISTINGS.length} αγγελιών...`);

  let ok = 0;
  let skip = 0;

  for (let i = 0; i < SEED_LISTINGS.length; i++) {
    const listing = SEED_LISTINGS[i];
    const hostId = hostIds[i % hostIds.length];

    if (!hostId) {
      console.error("  ✗ Δεν βρέθηκαν hosts — abort");
      break;
    }

    // Check if already exists
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("slug", listing.id)
      .maybeSingle();

    if (existing) {
      skip++;
      continue;
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    const { data: inserted, error } = await supabase
      .from("listings")
      .insert({
        slug: listing.id,
        user_id: hostId,
        title: listing.title,
        description: listing.description,
        city: listing.city,
        area: listing.area,
        latitude: listing.latitude,
        longitude: listing.longitude,
        price_monthly: listing.price_monthly,
        bedrooms: listing.bedrooms,
        sqm: listing.sqm,
        furnished: listing.furnished,
        utilities_included: listing.utilities_included,
        min_months: listing.min_months,
        property_type: listing.property_type,
        status: "approved",
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error(`  ✗ ${listing.id}:`, error?.message);
      continue;
    }

    const images = listing.listing_images.map((img) => ({
      listing_id: inserted.id,
      url: img.url,
      sort_order: img.sort_order,
    }));

    const { error: imgError } = await supabase.from("listing_images").insert(images);
    if (imgError) {
      console.error(`  ✗ Images ${listing.id}:`, imgError.message);
      continue;
    }

    ok++;
    if (ok % 10 === 0) console.log(`  ... ${ok} αγγελίες`);
  }

  console.log(`\n✅ Έτοιμο: ${ok} νέες, ${skip} ήδη υπήρχαν`);
}

async function main() {
  console.log("🚀 Midora Supabase Seed\n");
  await ensureHosts();
  if (hostIds.length === 0) {
    console.error("❌ Δεν δημιουργήθηκαν hosts");
    process.exit(1);
  }
  await seedListings();
  console.log("\n📌 Admin login: midora-host-1@midora-demo.local");
  console.log("   (reset password από Supabase Dashboard → Authentication)\n");
}

main().catch(console.error);
