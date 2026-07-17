type ProfileRow = Record<string, unknown>;

const OPTIONAL_PROFILE_COLUMNS = [
  "email",
  "referral_code",
  "display_name",
  "bio",
  "advertiser_type",
  "communication_languages",
  "preferred_contact_method",
  "business_name",
  "business_title",
  "public_slug",
  "public_profile_enabled",
  "show_owned_listings_on_profile",
  "show_cohosted_listings_on_profile",
] as const;

const MAX_RETRIES = OPTIONAL_PROFILE_COLUMNS.length + 4;

function missingColumnFromError(message: string): string | null {
  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column profiles\.([^ ]+) does not exist/i,
    /column "([^"]+)" of relation "profiles" does not exist/i,
  ];
  for (const re of patterns) {
    const match = message.match(re);
    if (match?.[1]) return match[1];
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseLike = any;

/**
 * Patch a profiles row. Prefer UPDATE so partial patches never null out NOT NULL columns
 * (e.g. full_name) — upsert with sparse payloads can violate constraints on conflict.
 */
export async function updateProfileRow(
  supabase: SupabaseLike,
  userId: string,
  row: ProfileRow
): Promise<{ error: { message: string } | null }> {
  const { id: _ignoreId, ...fields } = row;
  let payload: ProfileRow = { ...fields };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (existing?.id) {
      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (!error) return { error: null };

      const missing = missingColumnFromError(error.message);
      if (!missing || !(missing in payload)) return { error };

      const next = { ...payload };
      delete next[missing];
      payload = next;
      continue;
    }

    const insertPayload: ProfileRow = { ...payload, id: userId };
    const { error } = await supabase.from("profiles").upsert(insertPayload, {
      onConflict: "id",
    });
    if (!error) return { error: null };

    const missing = missingColumnFromError(error.message);
    if (!missing || !(missing in payload)) return { error };

    const next = { ...payload };
    delete next[missing];
    payload = next;
  }

  return { error: { message: "Profile update failed after schema retries" } };
}
