import Link from "next/link";
import { requireDashboardContext } from "@/lib/dashboard-context";
import { getCohostInviteByToken } from "@/lib/listing-cohosts-db";
import {
  acceptCohostInviteForm,
  declineCohostInviteForm,
} from "@/lib/listing-cohost-actions";
import { COHOST_PERMISSION_LEVEL_LABELS } from "@/lib/listing-cohost-permissions";

export default async function CohostInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { profile, email } = await requireDashboardContext(
    `/dashboard/cohost-invite/${token}`
  );

  const invite = await getCohostInviteByToken(token);
  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-xl font-semibold text-charcoal">
          Η πρόσκληση δεν βρέθηκε
        </h1>
        <p className="mt-2 text-sm text-muted">
          Η πρόσκληση μπορεί να έχει λήξει ή να έχει ήδη απαντηθεί.
        </p>
        <Link
          href="/dashboard/listings"
          className="mt-6 inline-flex rounded-xl bg-charcoal px-4 py-2 text-sm font-medium text-white"
        >
          Στα ακίνητά μου
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
      <h1 className="font-display text-xl font-semibold text-charcoal">
        Πρόσκληση συνοικοδεσπότη
      </h1>
      <p className="mt-2 text-sm text-muted">
        Προσκλήθηκες να βοηθήσεις στη διαχείριση αγγελίας στο Midora.
      </p>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5">
        <p className="text-sm text-muted">Αγγελία</p>
        <p className="font-medium text-charcoal">{listingTitle}</p>
        <p className="mt-4 text-sm text-muted">Δικαιώματα</p>
        <p className="font-medium text-charcoal">
          {COHOST_PERMISSION_LEVEL_LABELS[invite.permission_level]}
        </p>
        {invite.invite_message && (
          <>
            <p className="mt-4 text-sm text-muted">Μήνυμα</p>
            <p className="text-sm leading-relaxed text-charcoal/80">{invite.invite_message}</p>
          </>
        )}
      </div>

      {!emailMatches ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Η πρόσκληση στάλθηκε στο <strong>{invite.invited_email}</strong>. Συνδέσου με αυτό το
          email ({profile.email ?? "—"}) για να συνεχίσεις.
        </p>
      ) : (
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={acceptCohostInviteForm}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-xl bg-charcoal px-5 py-2.5 text-sm font-semibold text-white"
            >
              Αποδοχή πρόσκλησης
            </button>
          </form>
          <form action={declineCohostInviteForm}>
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-charcoal"
            >
              Απόρριψη
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
