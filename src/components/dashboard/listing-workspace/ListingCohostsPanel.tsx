"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Phone, Shield } from "lucide-react";
import type { ListingCohostWithProfile, ListingContactNumber } from "@/lib/types";
import {
  COHOST_PERMISSION_LEVEL_LABELS,
  COHOST_STATUS_LABELS,
  CONTACT_VISIBILITY_LABELS,
  DEFAULT_COHOST_INVITE_MESSAGE,
  MAX_COHOSTS_PER_LISTING,
  type CohostPermissionLevel,
} from "@/lib/listing-cohost-permissions";
import {
  deleteListingContactNumber,
  inviteListingCohost,
  removeListingCohost,
  resendListingCohostInvite,
  updateListingCohostPermission,
  upsertListingContactNumber,
} from "@/lib/listing-cohost-actions";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { profileDisplayName } from "@/lib/profile-display";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  cohosts: ListingCohostWithProfile[];
  contactNumbers: ListingContactNumber[];
  isOwner: boolean;
  canInvite: boolean;
};

function cohostDisplayName(row: ListingCohostWithProfile): string {
  if (row.profile) return profileDisplayName(row.profile);
  return row.invited_name || row.invited_email;
}

export function ListingCohostsPanel({
  listingId,
  cohosts,
  contactNumbers,
  isOwner,
  canInvite,
}: Props) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function runAction(action: () => Promise<{ success?: true; error?: string }>) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await action();
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Οι αλλαγές αποθηκεύτηκαν.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-base font-semibold text-charcoal">Συνοικοδεσπότες</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Πρόσθεσε άτομα που μπορούν να βοηθούν στη διαχείριση της αγγελίας και στην επικοινωνία με
          ενδιαφερόμενους.
        </p>
        <p className="mt-2 text-xs text-muted">
          Μπορείς να προσθέσεις έως {MAX_COHOSTS_PER_LISTING} συνοικοδεσπότες σε αυτή την αγγελία.
        </p>

        {isOwner && canInvite && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-charcoal px-4 text-sm font-medium text-white hover:bg-charcoal/90"
          >
            <UserPlus className="h-4 w-4" />
            Πρόσκληση συνοικοδεσπότη
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-xl border border-teal/25 bg-teal/10 px-4 py-3 text-sm text-charcoal">
          {success}
        </p>
      )}

      {cohosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-10 text-center">
          <p className="text-sm text-muted">Δεν έχεις προσκαλέσει ακόμα συνοικοδεσπότες.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cohosts.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <ProfileAvatar
                  profile={
                    row.profile ?? { full_name: row.invited_name ?? row.invited_email }
                  }
                  size="md"
                />
                <div className="min-w-0">
                  <p className="font-medium text-charcoal">{cohostDisplayName(row)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <Mail className="h-3.5 w-3.5" />
                    {row.invited_email}
                  </p>
                  {row.profile?.phone && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                      <Phone className="h-3.5 w-3.5" />
                      {row.profile.phone}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-charcoal">
                      {COHOST_STATUS_LABELS[row.status]}
                    </span>
                    <span className="rounded-full bg-charcoal/8 px-2.5 py-0.5 text-xs font-medium text-charcoal">
                      {COHOST_PERMISSION_LEVEL_LABELS[row.permission_level]}
                    </span>
                  </div>
                  {row.last_active_at && (
                    <p className="mt-1 text-xs text-muted">
                      Τελευταία δραστηριότητα:{" "}
                      {new Intl.DateTimeFormat("el-GR", { dateStyle: "medium" }).format(
                        new Date(row.last_active_at)
                      )}
                    </p>
                  )}
                </div>
              </div>

              {isOwner && row.status !== "removed" && (
                <div className="flex flex-wrap gap-2">
                  {row.status === "pending" && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        runAction(() => resendListingCohostInvite(row.id, listingId))
                      }
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
                    >
                      Επαναποστολή πρόσκλησης
                    </button>
                  )}
                  <PermissionSelect
                    value={row.permission_level}
                    disabled={pending || row.status === "declined"}
                    onChange={(level) =>
                      runAction(() =>
                        updateListingCohostPermission(row.id, listingId, level)
                      )
                    }
                  />
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => runAction(() => removeListingCohost(row.id, listingId))}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    Αφαίρεση
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ContactNumbersSection
        listingId={listingId}
        contactNumbers={contactNumbers}
        pending={pending}
        onAction={runAction}
      />

      {inviteOpen && (
        <InviteCohostModal
          listingId={listingId}
          pending={pending}
          onClose={() => setInviteOpen(false)}
          onSubmit={(formData) =>
            runAction(async () => {
              const result = await inviteListingCohost(listingId, formData);
              if ("success" in result) setInviteOpen(false);
              return result;
            })
          }
        />
      )}
    </div>
  );
}

function PermissionSelect({
  value,
  onChange,
  disabled,
}: {
  value: CohostPermissionLevel;
  onChange: (v: CohostPermissionLevel) => void;
  disabled?: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-muted">
      <Shield className="h-3.5 w-3.5" />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as CohostPermissionLevel)}
        className="rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-medium text-charcoal"
      >
        {Object.entries(COHOST_PERMISSION_LEVEL_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

function InviteCohostModal({
  listingId,
  pending,
  onClose,
  onSubmit,
}: {
  listingId: string;
  pending: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-charcoal">Πρόσκληση συνοικοδεσπότη</h3>
        <form
          className="mt-4 space-y-4"
          action={(formData) => onSubmit(formData)}
        >
          <label className="block">
            <span className="text-xs font-medium text-muted">Email συνοικοδεσπότη</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Όνομα (προαιρετικό)</span>
            <input
              name="name"
              type="text"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Επίπεδο δικαιωμάτων</span>
            <select
              name="permission_level"
              defaultValue="full_access"
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            >
              {Object.entries(COHOST_PERMISSION_LEVEL_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted">Μήνυμα (προαιρετικό)</span>
            <textarea
              name="message"
              rows={3}
              defaultValue={DEFAULT_COHOST_INVITE_MESSAGE}
              className="mt-1 w-full rounded-xl border border-border px-3 py-2.5 text-sm"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-charcoal"
            >
              Ακύρωση
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-charcoal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Αποστολή πρόσκλησης
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactNumbersSection({
  listingId,
  contactNumbers,
  pending,
  onAction,
}: {
  listingId: string;
  contactNumbers: ListingContactNumber[];
  pending: boolean;
  onAction: (action: () => Promise<{ success?: true; error?: string }>) => void;
}) {
  return (
    <div>
      <h3 className="font-display text-base font-semibold text-charcoal">Τηλέφωνα επικοινωνίας</h3>
      <p className="mt-1 text-sm text-muted">
        Πρόσθεσε τηλέφωνο για αυτή την αγγελία. Η προεπιλογή δεν είναι δημόσια.
      </p>

      {contactNumbers.length > 0 && (
        <ul className="mt-4 space-y-2">
          {contactNumbers.map((num) => (
            <li
              key={num.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-charcoal">
                  {num.label || (num.role === "owner" ? "Ιδιοκτήτης" : "Συνοικοδεσπότης")}
                </p>
                <p className="text-muted">{num.phone_number}</p>
                <p className="text-xs text-muted">{CONTACT_VISIBILITY_LABELS[num.visibility]}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  onAction(() => deleteListingContactNumber(num.id, listingId))
                }
                className="text-xs font-medium text-red-700 hover:underline disabled:opacity-50"
              >
                Διαγραφή
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-4 grid gap-3 rounded-2xl border border-border bg-sand/30 p-4 sm:grid-cols-2"
        action={(formData) =>
          onAction(() => upsertListingContactNumber(listingId, formData))
        }
      >
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-muted">Αριθμός τηλεφώνου</span>
          <input
            name="phone_number"
            type="tel"
            required
            placeholder="+30 69..."
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Ετικέτα</span>
          <input
            name="label"
            type="text"
            placeholder="Διαχείριση ακινήτου"
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-muted">Ορατότητα</span>
          <select
            name="visibility"
            defaultValue="private"
            className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"
          >
            {Object.entries(CONTACT_VISIBILITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "sm:col-span-2 inline-flex min-h-10 items-center justify-center rounded-xl border border-charcoal/15 bg-white text-sm font-medium text-charcoal hover:border-gold/30 disabled:opacity-50"
          )}
        >
          Αποθήκευση τηλεφώνου
        </button>
      </form>
    </div>
  );
}
