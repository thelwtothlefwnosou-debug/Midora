export type PublicProfileLinkContext = {
  interestFrom?: string;
  interestTo?: string;
  durationMonths?: number;
  rentalType?: string;
};

type ProfileSlugSource = {
  id: string;
  public_slug?: string | null;
  public_profile_enabled?: boolean | null;
};

export function publicProfilePath(
  profile: ProfileSlugSource,
  context?: PublicProfileLinkContext
): string | null {
  if (profile.public_profile_enabled === false) return null;
  const slug = profile.public_slug?.trim();
  const base = slug ? `/users/${slug}` : `/users/${profile.id}`;
  if (!context) return base;

  const params = new URLSearchParams();
  if (context.interestFrom) params.set("interestFrom", context.interestFrom);
  if (context.interestTo) params.set("interestTo", context.interestTo);
  if (context.durationMonths != null) {
    params.set("durationMonths", String(context.durationMonths));
  }
  if (context.rentalType) params.set("rentalType", context.rentalType);

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
