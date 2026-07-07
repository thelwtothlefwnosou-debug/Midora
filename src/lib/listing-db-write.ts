type ListingRow = Record<string, unknown>;

const PORTAL_OPTIONAL_COLUMNS = [
  "accepts_under_60_days",
  "address_street",
  "address_number",
  "address_postal_code",
  "address_floor",
  "address_unit",
  "included_guests",
  "extra_guest_fee_per_night",
  "ama_declaration_accepted",
  "contact_name",
  "contact_phone",
  "contact_email",
  "preferred_contact",
  "location_needs_review",
  "approval_status",
  "price_per_night",
  "rental_type",
  "price_type",
  "ama_number",
  "legal_registry_type",
  "min_stay_label",
  "availability_status",
  "availability_note",
  "external_listing_url",
  "property_verification_method",
  "midora_verification_code",
  "owner_responsibility_accepted",
  "platform_role_accepted",
  "terms_privacy_accepted",
  "declarations_submitted_at",
  "city_display_name",
  "area_display_name",
  "formatted_address",
  "provider_place_id",
  "location_confirmed_at",
  "location_confirmed_by_owner",
  "location_pin_moved_manually",
  "private_street",
  "private_street_number",
  "private_postal_code",
  "use_profile_contact",
  "allow_phone_contact",
  "allow_whatsapp",
  "allow_viber",
  "allow_message",
  "contact_whatsapp_phone",
  "contact_viber_phone",
  "contact_whatsapp_use_primary",
  "contact_viber_use_primary",
  "location_admin_reviewed_at",
  "location_admin_status",
  "property_verification_status",
  "description_en",
  "latitude",
  "longitude",
  "bathrooms",
  "floor",
  "total_floors",
  "year_built",
  "year_renovated",
  "has_balcony",
  "has_elevator",
  "heating_type",
  "energy_class",
  "max_guests",
  "cleaning_included",
  "supports_short_term",
  "supports_monthly",
  "minimum_stay_nights",
  "minimum_stay_months",
  "monthly_includes_bills",
  "monthly_terms",
] as const;

const MAX_SCHEMA_RETRIES = PORTAL_OPTIONAL_COLUMNS.length + 12;

function missingColumnFromError(message: string): string | null {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column listings\.([^ ]+) does not exist/i,
    /column "([^"]+)" of relation "listings" does not exist/i,
  ];
  for (const re of patterns) {
    const match = message.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

function stripColumn(row: ListingRow, column: string): ListingRow {
  const next = { ...row };
  delete next[column];
  return next;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

type ListingWriteResult = {
  data: { id: string } | null;
  error: { message: string } | null;
};

async function resolveInsertedListingId(
  supabase: SupabaseLike,
  userId: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from("listings")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ? { id: data.id } : null;
}

async function runListingInsert(
  supabase: SupabaseLike,
  payload: ListingRow,
  userId?: string
): Promise<ListingWriteResult> {
  const result = await supabase
    .from("listings")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (result.error) return result;
  if (result.data?.id) return result;

  if (userId) {
    const fallback = await resolveInsertedListingId(supabase, userId);
    if (fallback) return { data: fallback, error: null };
  }

  return {
    data: null,
    error: { message: "Insert succeeded but listing id was not returned" },
  };
}

export async function insertListingRow(
  supabase: SupabaseLike,
  row: ListingRow,
  userId?: string
): Promise<ListingWriteResult> {
  let payload: ListingRow = { ...row };

  for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt++) {
    const result = await runListingInsert(supabase, payload, userId);
    if (!result.error) return result;

    const missing = missingColumnFromError(result.error.message);
    if (!missing || !(missing in payload)) return result;
    payload = stripColumn(payload, missing);
  }

  return runListingInsert(supabase, payload, userId);
}

export async function updateListingRow(
  supabase: SupabaseLike,
  listingId: string,
  userId: string,
  row: ListingRow
): Promise<ListingWriteResult> {
  let payload: ListingRow = { ...row };
  delete payload.user_id;

  for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt++) {
    const result = await supabase
      .from("listings")
      .update(payload)
      .eq("id", listingId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();

    if (!result.error && result.data?.id) return result;
    if (result.error) {
      const missing = missingColumnFromError(result.error.message);
      if (!missing || !(missing in payload)) return result;
      payload = stripColumn(payload, missing);
      continue;
    }

    return { data: { id: listingId }, error: null };
  }

  return supabase
    .from("listings")
    .update(payload)
    .eq("id", listingId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
}
