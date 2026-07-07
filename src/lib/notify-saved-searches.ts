import { createServiceClient } from "@/lib/supabase/service";
import { getListingById } from "@/lib/listings";
import { sendEmail } from "@/lib/email";
import {
  buildAlertEmailHtml,
  buildAlertEmailSubject,
  listingMatchesSavedFilters,
} from "@/lib/search-alerts";
import type { SavedSearchFilters } from "@/lib/saved-searches";

type SavedSearchRow = {
  id: string;
  user_id: string;
  name: string;
  filters: SavedSearchFilters;
  email_alerts: boolean;
};

/** Στείλε email σε χρήστες whose saved search ταιριάζει με νέα/εγκεκριμένη αγγελία */
export async function notifySavedSearchMatches(listingId: string) {
  const service = createServiceClient();
  if (!service) {
    console.warn("[search-alerts] No service client — skipping notifications");
    return;
  }

  const listing = await getListingById(listingId);
  if (!listing) return;

  const { data: searches, error } = await service
    .from("saved_searches")
    .select("id, user_id, name, filters, email_alerts")
    .eq("email_alerts", true);

  if (error) {
    if (error.code === "42P01" || error.message.includes("email_alerts")) {
      console.warn("[search-alerts] Migration not applied yet");
      return;
    }
    console.error("[search-alerts]", error.message);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const matching = (searches as SavedSearchRow[]).filter((s) =>
    listingMatchesSavedFilters(listing, s.filters ?? {})
  );

  for (const search of matching) {
    const { data: existing } = await service
      .from("saved_search_notifications")
      .select("listing_id")
      .eq("saved_search_id", search.id)
      .eq("listing_id", listingId)
      .maybeSingle();

    if (existing) continue;

    const { data: userData, error: userErr } =
      await service.auth.admin.getUserById(search.user_id);

    if (userErr || !userData.user.email) continue;

    const sent = await sendEmail({
      to: userData.user.email,
      subject: buildAlertEmailSubject(search.name, listing),
      html: buildAlertEmailHtml({
        searchName: search.name,
        listing,
        appUrl,
      }),
    });

    if (sent) {
      await service.from("saved_search_notifications").insert({
        saved_search_id: search.id,
        listing_id: listingId,
      });

      await service
        .from("saved_searches")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", search.id);
    }
  }
}
