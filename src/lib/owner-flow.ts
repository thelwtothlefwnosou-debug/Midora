/** Canonical owner listing creation path (protected by middleware). */
export const OWNER_LISTING_NEW_PATH = "/dashboard/listings/new";

/** Build login/register URL with post-auth redirect. */
export function buildAuthRedirectUrl(
  path: string,
  mode?: "login" | "register"
): string {
  const params = new URLSearchParams();
  params.set("redirect", path);
  if (mode === "register") params.set("mode", "register");
  return `/login?${params.toString()}`;
}
