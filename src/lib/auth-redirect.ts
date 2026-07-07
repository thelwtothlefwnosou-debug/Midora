/** Safe internal path after login — never bounce back to homepage or auth screens. */
export function safePostAuthPath(path: string | null | undefined): string {
  const value = path?.trim() || "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (
    value === "/" ||
    value.startsWith("/login") ||
    value.startsWith("/register") ||
    value.startsWith("/auth/callback")
  ) {
    return "/dashboard";
  }
  return value;
}
