type ProfileRow = Record<string, unknown>;

const OPTIONAL_PROFILE_COLUMNS = [
  "display_name",
  "bio",
  "advertiser_type",
  "communication_languages",
  "preferred_contact_method",
  "business_name",
  "business_title",
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

export async function updateProfileRow(
  supabase: SupabaseLike,
  userId: string,
  row: ProfileRow
): Promise<{ error: { message: string } | null }> {
  let payload: ProfileRow = { ...row, id: userId };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (!error) return { error: null };

    const missing = missingColumnFromError(error.message);
    if (!missing || !(missing in payload)) return { error };

    const next = { ...payload };
    delete next[missing];
    payload = next;
  }

  return { error: { message: "Profile update failed after schema retries" } };
}
