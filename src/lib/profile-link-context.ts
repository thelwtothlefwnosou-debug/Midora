import type { PublicProfileLinkContext } from "@/lib/profile-public-url";

type SearchParamReader = {
  get: (key: string) => string | null;
};

export function buildProfileLinkContextFromSearchParams(
  searchParams: SearchParamReader,
  rentalMode: "short_term" | "monthly"
): PublicProfileLinkContext {
  const interestFrom =
    searchParams.get("interestFrom")?.trim() ||
    searchParams.get("checkIn")?.trim() ||
    searchParams.get("start")?.trim() ||
    undefined;
  const interestTo =
    searchParams.get("interestTo")?.trim() ||
    searchParams.get("checkOut")?.trim() ||
    searchParams.get("end")?.trim() ||
    undefined;
  const durationRaw = searchParams.get("durationMonths")?.trim();
  const durationMonths = durationRaw ? parseInt(durationRaw, 10) : undefined;

  return {
    interestFrom: interestFrom || undefined,
    interestTo: interestTo || undefined,
    durationMonths: Number.isFinite(durationMonths) ? durationMonths : undefined,
    rentalType: rentalMode,
  };
}
