type IdentityLike = {
  provider?: string;
  identity_data?: Record<string, unknown>;
};

export type AuthProfileNameInput = {
  email?: string | null;
  userMetadata?: Record<string, unknown> | null;
  identities?: IdentityLike[] | null;
};

const GENERIC_PROFILE_NAMES = new Set([
  "",
  "χρήστης",
  "χρήστης midora",
  "user",
  "midora user",
  "account",
  "λογαριασμός",
]);

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function isGenericProfileName(name: string | null | undefined): boolean {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) return true;
  return GENERIC_PROFILE_NAMES.has(trimmed.toLowerCase());
}

function nameFromIdentityData(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;

  const direct =
    asTrimmedString(data.full_name) ??
    asTrimmedString(data.name) ??
    asTrimmedString(data.display_name);
  if (direct && !isGenericProfileName(direct)) return direct;

  const given = asTrimmedString(data.given_name);
  const family = asTrimmedString(data.family_name);
  if (given) {
    const combined = [given, family].filter(Boolean).join(" ").trim();
    if (combined && !isGenericProfileName(combined)) return combined;
  }

  return null;
}

function emailLocalPart(email: string | null | undefined): string | null {
  const local = email?.split("@")[0]?.trim();
  return local || null;
}

/** Best display/full name from OAuth metadata, identities, or email. */
export function resolveAuthProfileName(input: AuthProfileNameInput): string {
  const meta = input.userMetadata ?? {};

  const metaCandidates = [
    meta.display_name,
    meta.full_name,
    meta.name,
    meta.preferred_username,
    meta.user_name,
  ];

  for (const candidate of metaCandidates) {
    const value = asTrimmedString(candidate);
    if (value && !isGenericProfileName(value)) return value;
  }

  for (const identity of input.identities ?? []) {
    const fromIdentity = nameFromIdentityData(identity.identity_data);
    if (fromIdentity) return fromIdentity;
  }

  const given = asTrimmedString(meta.given_name);
  const family = asTrimmedString(meta.family_name);
  if (given) {
    const combined = [given, family].filter(Boolean).join(" ").trim();
    if (combined && !isGenericProfileName(combined)) return combined;
  }

  const fromEmail = emailLocalPart(input.email);
  if (fromEmail && !isGenericProfileName(fromEmail)) return fromEmail;

  return "Χρήστης";
}

export function pickProfileFullName(params: {
  incoming: string | null | undefined;
  existing?: string | null;
  email?: string | null;
}): string {
  const incoming = params.incoming?.trim() ?? "";
  const existing = params.existing?.trim() ?? "";

  if (incoming && !isGenericProfileName(incoming)) return incoming;
  if (existing && !isGenericProfileName(existing)) return existing;
  if (incoming) return incoming;
  if (existing) return existing;

  return emailLocalPart(params.email) ?? "Χρήστης";
}

export function resolveMenuDisplayName(params: {
  profileFullName?: string | null;
  profileDisplayName?: string | null;
  auth: AuthProfileNameInput;
}): string {
  const fromProfile =
    asTrimmedString(params.profileDisplayName) ?? asTrimmedString(params.profileFullName);
  if (fromProfile && !isGenericProfileName(fromProfile)) return fromProfile;
  return resolveAuthProfileName(params.auth);
}
