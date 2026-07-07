import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { validateBasicDetails } from "../src/lib/listing-wizard-validation";
import {
  parsePortalListingFields,
  validatePortalListingFields,
} from "../src/lib/listing-portal-payload";

function loadEnv() {
  try {
    readFileSync(resolve(".env.local"), "utf-8")
      .split("\n")
      .forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eq = trimmed.indexOf("=");
        if (eq === -1) return;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      });
  } catch {
    // ignore
  }
}

loadEnv();

const listingId = process.argv[2] ?? "415ccd99-9f2b-487e-b970-0382a2ed5e1d";

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function listingToFormData(row: Record<string, unknown>): FormData {
  const fd = new FormData();
  const set = (k: string, v: unknown) => {
    if (v == null || v === "") return;
    fd.set(k, String(v));
  };

  if (row.rental_type === "short_term" || row.price_per_night) {
    fd.set("supports_short_term", "on");
  }
  if (row.rental_type === "monthly" || row.price_monthly) {
    fd.set("supports_monthly", "on");
  }

  set("title", row.title);
  set("city", row.city);
  set("area", row.area);
  set("address_street", row.address_street);
  set("address_number", row.address_number);
  set("address_postal_code", row.address_postal_code);
  set("property_type", row.property_type);
  set("sqm", row.sqm);
  set("bedrooms", row.bedrooms);
  set("bathrooms", row.bathrooms);
  set("description", row.description);
  set("price_per_night", row.price_per_night);
  set("price_monthly", row.price_monthly);
  set("included_guests", row.included_guests);
  set("extra_guest_fee_per_night", row.extra_guest_fee_per_night);
  set("max_guests", row.max_guests);
  set("min_stay_label", row.min_stay_label);
  set("legal_registry_type", row.legal_registry_type);
  set("ama_number", row.ama_number);
  set("availability_status", row.availability_status ?? "upon_request");
  set("contact_name", row.contact_name);
  set("contact_phone", row.contact_phone);
  set("contact_email", row.contact_email);
  set("preferred_contact", row.preferred_contact ?? "message");
  set("accepts_under_60_days", row.accepts_under_60_days ? "yes" : "no");
  if (row.owner_responsibility_accepted) fd.set("owner_responsibility_accepted", "on");
  if (row.platform_role_accepted) fd.set("platform_role_accepted", "on");
  if (row.ama_declaration_accepted) fd.set("ama_declaration_accepted", "on");
  fd.set("furnished", "on");
  fd.set("min_months", "1");
  return fd;
}

async function main() {
  const { data: row, error } = await db
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !row) {
    console.error("Not found", error?.message);
    process.exit(1);
  }

  const fd = listingToFormData(row as Record<string, unknown>);
  const fields = parsePortalListingFields(fd);

  const basic = validateBasicDetails({
    title: fields.title,
    city: fields.city,
    area: fields.area,
    addressStreet: fields.address_street ?? "",
    addressNumber: fields.address_number ?? "",
    addressPostalCode: fields.address_postal_code ?? "",
    propertyType: fields.property_type,
    sqm: String(fields.sqm ?? ""),
    bedrooms: String(fields.bedrooms),
    bathrooms: fields.bathrooms != null ? String(fields.bathrooms) : "",
    floor: fields.floor != null ? String(fields.floor) : "",
    description: fields.description,
    forSubmission: true,
  });

  const portal = validatePortalListingFields(fields, { forSubmission: true });

  console.log(
    JSON.stringify(
      {
        listingId,
        title: row.title,
        photosReady: true,
        basicValidation: basic,
        portalValidation: portal,
        canSubmitFromDbFields: !basic && !portal,
        resumeUrl: `/dashboard/listings/new?draft=${listingId}`,
      },
      null,
      2
    )
  );
}

main().catch(console.error);
