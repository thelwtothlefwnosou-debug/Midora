/**
 * Showcase short-term listing for the owner account — approved, searchable, fully populated.
 * Run: npx tsx scripts/seed-owner-short-term-demo.ts
 * Or:  npx tsx scripts/seed-owner-short-term-demo.ts --email=user@example.com
 */

import { randomUUID } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MIN_LISTING_PHOTOS_FOR_REVIEW } from "../src/lib/constants";
import { insertListingRow } from "../src/lib/listing-db-write";
import { PROFILE_AVATARS_BUCKET } from "../src/lib/profile-avatar";
import { getSupabaseEnv, loadEnv } from "./db-env";

loadEnv();

const SEED_SLUG = "owner-showcase-short-term-plaka";

const UNSPLASH = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?w=${w}&q=88&auto=format`;

type PhotoSeed = {
  url: string;
  room_key: string;
  caption: string;
  is_cover?: boolean;
};

const PHOTOS: PhotoSeed[] = [
  {
    url: UNSPLASH("photo-1502672260266-1c1ef2d93688"),
    room_key: "living_room",
    caption: "Φωτεινό σαλόνι με design επίπλωση",
    is_cover: true,
  },
  {
    url: UNSPLASH("photo-1560448204-e02f11c3d0e2"),
    room_key: "living_room",
    caption: "Άνετος χώρος για χαλάρωση μετά την περιήγηση",
  },
  {
    url: UNSPLASH("photo-1556912173-46c336c7fd55"),
    room_key: "kitchen",
    caption: "Πλήρως εξοπλισμένη κουζίνα με Nespresso",
  },
  {
    url: UNSPLASH("photo-1522708323590-d24dbb6b0267"),
    room_key: "dining_room",
    caption: "Τραπεζαρία για πρωινό με θέα στην αυλή",
  },
  {
    url: UNSPLASH("photo-1616598222612-ef8299077817"),
    room_key: "bedroom_1",
    caption: "Κύριο υπνοδωμάτιο με queen-size κρεβάτι",
  },
  {
    url: UNSPLASH("photo-1631049307264-da0ec9d70304"),
    room_key: "bedroom_1",
    caption: "Αισθηση boutique ξενοδοχείου στο δεύτερο υπνοδωμάτιο",
  },
  {
    url: UNSPLASH("photo-1595526114035-0d45ed16cfbf"),
    room_key: "bedroom_2",
    caption: "Δεύτερο υπνοδωμάτιο — ιδανικό για παιδιά ή επισκέπτες",
  },
  {
    url: UNSPLASH("photo-1620626011761-996317b8d101"),
    room_key: "bathroom_1",
    caption: "Μοντέρνο μπάνιο με ντους και προϊόντα περιποίησης",
  },
  {
    url: UNSPLASH("photo-1600607687939-ce8a6c25118c"),
    room_key: "balcony",
    caption: "Βεράντα με θέα στην Ακρόπολη",
  },
  {
    url: UNSPLASH("photo-1600585154340-be6161a56a0c"),
    room_key: "outdoor",
    caption: "Ήσυχη γειτονιά στην Πλάκα, λίγα λεπτά από την Ακρόπολη",
  },
  {
    url: UNSPLASH("photo-1598928506311-c55ded86a2c0"),
    room_key: "workspace",
    caption: "Γραφείο με γρήγορο WiFi για remote work",
  },
  {
    url: UNSPLASH("photo-1600210492486-716fe82227fd"),
    room_key: "other",
    caption: "Λεπτομέρειες εσωτερικού — χειροποίητα αντικείμενα & τέχνη",
  },
];

const AMENITY_KEYS = [
  "wifi",
  "ac",
  "heating",
  "washer",
  "kitchen",
  "tv",
  "workspace",
  "iron",
  "hair_dryer",
  "linens",
  "balcony",
  "view",
  "terrace",
  "elevator",
  "self_checkin",
  "smoke_detector",
  "fire_extinguisher",
  "first_aid",
  "outdoor_lighting",
] as const;

const HIGHLIGHTS = [
  { label: "3 λεπτά από μετρό", icon_key: "train" },
  { label: "Θέα στην Ακρόπολη", icon_key: "waves" },
  { label: "Self check-in", icon_key: "key" },
  { label: "Χώρος εργασίας", icon_key: "laptop" },
  { label: "Ιδανικό για οικογένειες", icon_key: "users" },
] as const;

const OWNER_BIO =
  "Γεια σας! Είμαι ο Βαγγέλης και μεγάλωσα στην Αθήνα. Ανακαίνισα προσωπικά αυτό το διαμέρισμα στην Πλάκα για να νιώθουν οι επισκέπτες σαν στο σπίτι τους — καθαρό, ήσυχο και κοντά σε ό,τι χρειάζεστε στο κέντρο. Απαντώ γρήγορα στα μηνύματα, δίνω ξεκάθαρες οδηγίες άφιξης και είμαι διαθέσιμος αν χρειαστείτε κάτι κατά τη διαμονή σας.";

const DESCRIPTION = `Φωτεινό, πλήρως ανακαινισμένο διαμέρισμα 85τ.μ. στην καρδιά της Πλάκας — ιδανικό για city break, επαγγελματικά ταξίδια ή οικογενειακές διακοπές 2–10 νυχτών.

**Ο χώρος**
• 2 υπνοδωμάτια (queen + μονό + καναπές-κρεβάτι)
• 1 μπάνιο με ντους
• Ανοιχτό σαλόνι-τραπεζαρία με smart TV 55"
• Βεράντα με θέα στην Ακρόπολη
• Γραφείο με 500Mbps WiFi — ιδανικό για remote work

**Εξοπλισμός**
Κλιματισμός σε όλους τους χώρους, πλήρως εξοπλισμένη κουζίνα (φούρνος, μικροκύματα, Nespresso), πλυντήριο, σίδερο, πιστολάκι, λευκά είδη και πετσέτες, self check-in με smart lock.

**Γειτονιά**
3 λεπτά περπάτημα από σταθμό Ακρόπολη (μετρό), 8 λεπτά από την Ακρόπολη και το Μουσείο της Ακρόπολης. Σε ακτίνα 200μ. καφέ, εστιατόρια, mini market και πεζόδρομοι. Ήσυχη οδός — χωρίς θόρυβο νυχτερινής ζωής.

**Γιατί θα το αγαπήσετε**
Σχεδιασμένο με προσοχή στη λεπτομέρεια, καθαρό, με φυσικό φως όλη μέρα και αυθεντική αθηναϊκή ατμόσφαιρα. Ιδανικό για ζευγάρια, οικογένειες έως 5 ατόμων ή μικρές παρέες φίλων.`;

function parseArg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function findOwnerId(
  db: SupabaseClient,
  email?: string
): Promise<{ id: string; full_name: string | null; email: string | null; phone: string | null }> {
  if (email) {
    const { data: authUsers, error } = await db.auth.admin.listUsers({ perPage: 500 });
    if (error) throw new Error(error.message);
    const user = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error(`No auth user for email: ${email}`);
    const { data: profile } = await db
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    return {
      id: user.id,
      full_name: profile?.full_name ?? null,
      email: user.email ?? null,
      phone: profile?.phone ?? null,
    };
  }

  const { data: profiles, error } = await db.from("profiles").select("id, full_name, phone").limit(100);
  if (error) throw new Error(error.message);

  const match =
    profiles?.find((p) => /vaggelis|vagelis|psarras/i.test(p.full_name ?? "")) ??
    profiles?.find((p) => p.full_name && !/Παπαδόπουλος|Νικολάου|Αντωνίου/i.test(p.full_name)) ??
    profiles?.[0];

  if (!match) throw new Error("No profiles found");

  const { data: authUser } = await db.auth.admin.getUserById(match.id);

  return {
    id: match.id,
    full_name: match.full_name,
    email: authUser.user?.email ?? null,
    phone: match.phone ?? null,
  };
}

async function deleteListingCascade(db: SupabaseClient, listingId: string) {
  const tables = [
    "listing_unavailable_periods",
    "listing_price_rules",
    "listing_amenities",
    "listing_highlights",
    "listing_sleeping_arrangements",
    "listing_images",
  ] as const;

  for (const table of tables) {
    await db.from(table).delete().eq("listing_id", listingId);
  }
  await db.from("listings").delete().eq("id", listingId);
}

async function ensureAvatarBucket(db: SupabaseClient) {
  const { data: buckets } = await db.storage.listBuckets();
  if (buckets?.some((b) => b.id === PROFILE_AVATARS_BUCKET)) return;

  const { error } = await db.storage.createBucket(PROFILE_AVATARS_BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  if (error && !/already exists/i.test(error.message)) {
    console.warn("Avatar bucket setup skipped:", error.message);
  }
}

async function uploadOwnerAvatar(db: SupabaseClient, ownerId: string): Promise<string | null> {
  await ensureAvatarBucket(db);
  const avatarUrl =
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=512&h=512&fit=crop&crop=faces&q=85&auto=format";

  try {
    const response = await fetch(avatarUrl);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const path = `${ownerId}/showcase-avatar.jpg`;

    const { error: uploadError } = await db.storage
      .from(PROFILE_AVATARS_BUCKET)
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      console.warn("Avatar upload skipped:", uploadError.message);
      return null;
    }
    return path;
  } catch (err) {
    console.warn("Avatar upload failed:", err);
    return null;
  }
}

async function updateOwnerProfile(
  db: SupabaseClient,
  owner: { id: string; full_name: string | null; phone: string | null }
) {
  const now = new Date().toISOString();
  const avatarPath = await uploadOwnerAvatar(db, owner.id);
  const phone = owner.phone?.trim() || "+30 697 123 4567";

  const patch: Record<string, unknown> = {
    full_name: owner.full_name?.trim() || "Βαγγέλης Ψαρράς",
    display_name: null,
    bio: OWNER_BIO,
    phone,
    advertiser_type: "individual",
    communication_languages: ["el", "en", "fr"],
    preferred_contact_method: "message",
    allow_phone_contact: true,
    allow_whatsapp: true,
    allow_viber: true,
    allow_message: true,
    whatsapp_use_primary_phone: true,
    viber_use_primary_phone: true,
    primary_phone_verified_at: now,
    show_profile_photo_public: true,
    avatar_status: "active",
  };

  if (avatarPath) {
    patch.avatar_path = avatarPath;
    patch.avatar_updated_at = now;
  }

  let remaining = { ...patch };
  for (let attempt = 0; attempt < 12; attempt++) {
    const { error } = await db.from("profiles").update(remaining).eq("id", owner.id);
    if (!error) return;

    const missing = error.message.match(/Could not find the '([^']+)' column/);
    if (!missing?.[1] || !(missing[1] in remaining)) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
    const { [missing[1]]: _drop, ...next } = remaining;
    remaining = next;
  }

  throw new Error("Profile update failed after stripping unknown columns");
}

async function main() {
  const { url, serviceKey } = getSupabaseEnv();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env in .env.local");
    process.exit(1);
  }

  const db = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const emailArg = parseArg("email");
  const owner = await findOwnerId(db, emailArg);
  console.log(`Owner: ${owner.full_name ?? owner.id} (${owner.email ?? "no email"})`);

  await updateOwnerProfile(db, owner);
  console.log("Owner profile updated (bio, languages, verified phone, avatar).");

  const { data: existingBySlug } = await db
    .from("listings")
    .select("id, title")
    .eq("slug", SEED_SLUG)
    .maybeSingle();

  if (existingBySlug) {
    await deleteListingCascade(db, existingBySlug.id);
    console.log(`Removed previous showcase: ${existingBySlug.title}`);
  }

  const { data: oldDemo } = await db
    .from("listings")
    .select("id, title")
    .eq("slug", "owner-demo-short-term")
    .maybeSingle();

  if (oldDemo) {
    await deleteListingCascade(db, oldDemo.id);
    console.log(`Removed old demo: ${oldDemo.title}`);
  }

  const listingId = randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  const row = {
    id: listingId,
    slug: SEED_SLUG,
    user_id: owner.id,
    title: "Design διαμέρισμα Πλάκα — θέα Ακρόπολη & ιστορικό κέντρο",
    description: DESCRIPTION,
    description_en:
      "Bright renovated 85sqm apartment in Plaka with Acropolis views. 2 bedrooms, workspace, fast WiFi, self check-in. 3 min to metro.",
    city: "Αθήνα",
    area: "Πλάκα",
    city_display_name: "Αθήνα",
    area_display_name: "Πλάκα",
    address: "Μνησικλέους 12, Αθήνα",
    address_street: "Μνησικλέους",
    address_number: "12",
    address_postal_code: "10556",
    address_floor: "3",
    formatted_address: "Μνησικλέους 12, Πλάκα, Αθήνα 10556",
    latitude: 37.9718,
    longitude: 23.7272,
    location_confirmed_by_owner: true,
    location_confirmed_at: now,
    rental_type: "short_term",
    supports_short_term: true,
    supports_monthly: false,
    price_type: "per_night",
    price_per_night: 95,
    weekend_price_per_night: 115,
    weekend_days: [5, 6],
    weekly_discount_percent: 10,
    early_bird_discount_percent: 8,
    cleaning_fee_note: "€45 εφάπαξ καθαριότητας (πληρώνεται κατά την άφιξη)",
    price_monthly: 1800,
    included_guests: 2,
    extra_guest_fee_per_night: 18,
    max_guests: 5,
    minimum_stay_nights: 2,
    min_stay_label: "2 νύχτες",
    bedrooms: 2,
    bathrooms: 1,
    sqm: 85,
    floor: 3,
    total_floors: 5,
    year_built: 1968,
    year_renovated: 2024,
    furnished: true,
    utilities_included: true,
    has_balcony: true,
    has_elevator: true,
    has_parking: false,
    pets_allowed: false,
    property_type: "apartment",
    heating_type: "κεντρική",
    energy_class: "C",
    ama_number: "00009876543",
    legal_registry_type: "ama",
    accepts_under_60_days: true,
    ama_declaration_accepted: true,
    availability_status: "available_now",
    availability_note: "Διαθέσιμο για άμεση κράτηση — ελάχιστη διαμονή 2 νύχτες",
    owner_responsibility_accepted: true,
    platform_role_accepted: true,
    terms_privacy_accepted: true,
    declarations_submitted_at: now,
    contact_name: owner.full_name ?? "Βαγγέλης",
    use_profile_contact: true,
    allow_phone_contact: true,
    allow_whatsapp: true,
    allow_viber: true,
    allow_message: true,
    pets_policy: "on_request",
    smoking_policy: "outdoor_only",
    events_policy: "no",
    quiet_hours_from: "23:00",
    quiet_hours_to: "08:00",
    check_in_from: "15:00",
    check_in_to: "22:00",
    check_out_until: "11:00",
    arrival_method: "self",
    cleaning_included: false,
    nearby_metro: "Ακρόπολη (3 λεπτά)",
    distance_center: "Στο ιστορικό κέντρο",
    distance_airport: "45 λεπτά με μετρό + λεωφορείο",
    distance_port: "25 λεπτά",
    status: "approved",
    approval_status: "approved",
    published_at: now,
    expires_at: expiresAt.toISOString(),
    is_hidden: false,
    view_count: 128,
    advertiser_verification_status: "verified",
    property_verification_status: "verified",
    identity_verified_at: now,
  };

  const { error: insertError } = await insertListingRow(db, row);
  if (insertError) throw new Error(insertError.message);

  const photoRows = PHOTOS.map((photo, i) => ({
    listing_id: listingId,
    url: photo.url,
    sort_order: i,
    media_type: "image",
    owner_id: owner.id,
    is_cover: photo.is_cover ?? i === 0,
    room_key: photo.room_key,
    caption: photo.caption,
    file_name: `showcase-${i + 1}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: 320000,
  }));

  const { error: photosError } = await db.from("listing_images").insert(photoRows);
  if (photosError) {
    const minimal = photoRows.map(({ listing_id, url, sort_order, room_key, is_cover }) => ({
      listing_id,
      url,
      sort_order,
      room_key,
      is_cover,
    }));
    const { error: minimalError } = await db.from("listing_images").insert(minimal);
    if (minimalError) throw new Error(minimalError.message);
  }

  const { data: insertedImages } = await db
    .from("listing_images")
    .select("id, room_key, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order");

  const bedroom1ImageId =
    insertedImages?.find((img) => img.room_key === "bedroom_1")?.id ?? null;

  const highlightRows = HIGHLIGHTS.map((h, i) => ({
    listing_id: listingId,
    label: h.label,
    icon_key: h.icon_key,
    sort_order: i,
  }));
  const { error: highlightsError } = await db.from("listing_highlights").insert(highlightRows);
  if (highlightsError) console.warn("Highlights skipped:", highlightsError.message);

  const sleepingRows = [
    {
      listing_id: listingId,
      room_name: "Υπνοδωμάτιο 1",
      bed_type: "Διπλό κρεβάτι",
      quantity: 1,
      sort_order: 0,
      listing_image_id: bedroom1ImageId,
      bed_size_note: "Queen 160×200",
    },
    {
      listing_id: listingId,
      room_name: "Υπνοδωμάτιο 2",
      bed_type: "Μονό κρεβάτι",
      quantity: 1,
      sort_order: 1,
      bed_size_note: "90×200",
    },
    {
      listing_id: listingId,
      room_name: "Σαλόνι",
      bed_type: "Καναπές-κρεβάτι",
      quantity: 1,
      sort_order: 2,
    },
  ];
  const { error: sleepingError } = await db
    .from("listing_sleeping_arrangements")
    .insert(sleepingRows);
  if (sleepingError) console.warn("Sleeping arrangements skipped:", sleepingError.message);

  const amenityRows = AMENITY_KEYS.map((amenity_key, sort_order) => ({
    listing_id: listingId,
    amenity_key,
    sort_order,
  }));
  const { error: amenitiesError } = await db.from("listing_amenities").insert(amenityRows);
  if (amenitiesError) console.warn("Amenities skipped:", amenitiesError.message);

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const blockedStart = new Date(today);
  blockedStart.setDate(blockedStart.getDate() + 14);
  const blockedEnd = new Date(blockedStart);
  blockedEnd.setDate(blockedEnd.getDate() + 3);

  const summerStart = new Date(today);
  summerStart.setMonth(summerStart.getMonth() + 2);
  const summerEnd = new Date(summerStart);
  summerEnd.setDate(summerEnd.getDate() + 5);

  const periods = [
    {
      listing_id: listingId,
      owner_id: owner.id,
      start_date: fmt(blockedStart),
      end_date: fmt(blockedEnd),
      reason: "unavailable",
      note: "Κράτηση επισκέπτη",
    },
    {
      listing_id: listingId,
      owner_id: owner.id,
      start_date: fmt(summerStart),
      end_date: fmt(summerEnd),
      reason: "personal_use",
      note: "Προσωπική χρήση",
    },
  ];

  const { error: periodsError } = await db.from("listing_unavailable_periods").insert(periods);
  if (periodsError) console.warn("Unavailable periods skipped:", periodsError.message);

  const highSeasonStart = new Date(today);
  highSeasonStart.setMonth(highSeasonStart.getMonth() + 1);
  const highSeasonEnd = new Date(highSeasonStart);
  highSeasonEnd.setMonth(highSeasonEnd.getMonth() + 2);

  const { error: priceRuleError } = await db.from("listing_price_rules").insert({
    listing_id: listingId,
    owner_id: owner.id,
    start_date: fmt(highSeasonStart),
    end_date: fmt(highSeasonEnd),
    label: "Υψηλή περίοδος",
    price_per_night: 125,
    included_guests: 2,
    extra_guest_fee_per_night: 20,
    min_stay_nights: 3,
  });
  if (priceRuleError) console.warn("Price rule skipped:", priceRuleError.message);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

  console.log("\n✅ Showcase short-term listing ready");
  console.log(`  Photos:     ${PHOTOS.length} (min review: ${MIN_LISTING_PHOTOS_FOR_REVIEW})`);
  console.log(`  ID:         ${listingId}`);
  console.log(`  Slug:       ${SEED_SLUG}`);
  console.log(`  Public:     ${baseUrl}/listings/${SEED_SLUG}`);
  console.log(`  Search:     ${baseUrl}/listings?rentalType=short_term&city=Αθήνα`);
  console.log(`  Edit:       ${baseUrl}/dashboard/listings/${listingId}/edit`);
  console.log(`  Dashboard:  ${baseUrl}/dashboard/listings`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
