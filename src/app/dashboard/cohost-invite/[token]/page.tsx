import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getCohostInviteByToken } from "@/lib/listing-cohosts-db";
import {
  acceptCohostInviteForm,
  declineCohostInviteForm,
} from "@/lib/listing-cohost-actions";
import type { CohostPermissionLevel } from "@/lib/listing-cohost-permissions";

export default async function CohostInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { profile, email } = await requireDashboardContext(
    `/dashboard/cohost-invite/${token}`
  );
  const t = await getTranslations("Owner.cohostInvitePage");
  const tPerm = await getTranslations("Owner.cohostPermissions");

  const permissionLabel = (level: CohostPermissionLevel) => {
    switch (level) {
      case "full_access":
        return tPerm("fullAccess");
      case "messages_availability":
        return tPerm("messagesAvailability");
      case "messages_only":
        return tPerm("messagesOnly");
      default:
        return level;
    }
  };

  const invite = await getCohostInviteByToken(token);
  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-charcoal">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("notFoundBody")}</p>
        <Link
          href="/dashboard/listings"
          className="mt-6 inline-flex rounded-xl bg-charcoal px-4 py-2 text-sm font-medium text-white"
        >
          {t("backToListings")}
        </Link>
      </div>
    );
  }

  const userEmail = email?.trim().toLowerCase();
  const emailMatches = userEmail === invite.invited_email;
  const listingTitle =
    (invite as { listings?: { title?: string } | null }).listings?.title ?? "—";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-xl font-semibold text-charcoal">{t("title")}</h1>
      <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">{t("listingLabel")}</p>
        <p className="font-medium text-charcoal">{listingTitle}</p>
        <p className="mt-4 text-sm text-muted">{t("permissionsLabel")}</p>
        <p className="font-medium text-charcoal">
          {permissionLabel(invite.permission_level)}
        </p>
        {invite.invite_message && (
          <>
            <p className="mt-4 text-sm text-muted">{t("messageLabel")}</p>
            <p className="text-sm leading-relaxed text-charcoal/80">{invite.invite_message}</p>
          </>
        )}
      </div>

      {!emailMatches ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("emailMismatch", {
            email: invite.invited_email,
            current: profile.email ?? "—",
          })}
        </p>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={acceptCohostInviteForm}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-xl bg-charcoal px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("accept")}
            </button>
          </form>
          <form action={declineCohostInviteForm}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-charcoal"
            >
              {t("decline")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
