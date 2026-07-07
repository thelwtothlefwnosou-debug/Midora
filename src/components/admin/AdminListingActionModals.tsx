"use client";



import { useState, useTransition } from "react";

import {

  adminApproveListing,

  adminHideListing,

  adminRejectListing,

  adminRequestListingChanges,

  adminRestoreListing,

  adminSuspendUser,

} from "@/lib/admin/actions";

import { ADMIN_CHANGE_REASONS } from "@/lib/admin/change-reasons";

import { cn } from "@/lib/utils";



type Props = {

  listingId: string;

  ownerUserId?: string | null;

  isHidden?: boolean;

  compact?: boolean;

  showHide?: boolean;

  showReviewActions?: boolean;

  canApprove?: boolean;

  onError?: (message: string) => void;

  onSuccess?: () => void;

};



export function AdminListingActionModals({

  listingId,

  ownerUserId,

  isHidden = false,

  compact = false,

  showHide = true,

  showReviewActions = true,

  canApprove = true,

  onError,

  onSuccess,

}: Props) {

  const [pending, startTransition] = useTransition();

  const [approveOpen, setApproveOpen] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);

  const [changesOpen, setChangesOpen] = useState(false);

  const [suspendOpen, setSuspendOpen] = useState(false);

  const [rejectReason, setRejectReason] = useState("");

  const [changeNote, setChangeNote] = useState("");

  const [changeReasonIds, setChangeReasonIds] = useState<string[]>([]);

  const [suspendNote, setSuspendNote] = useState("");



  function run(action: () => Promise<{ error?: string } | void>) {

    startTransition(async () => {

      const result = await action();

      if (result && "error" in result && result.error) {

        onError?.(result.error);

        return;

      }

      setApproveOpen(false);

      setRejectOpen(false);

      setChangesOpen(false);

      setSuspendOpen(false);

      onSuccess?.();

    });

  }



  function toggleReason(id: string) {

    setChangeReasonIds((prev) =>

      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]

    );

  }



  const btnClass = compact

    ? "rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-50"

    : "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50";



  return (

    <>

      <div className={cn("flex flex-wrap gap-1.5", compact && "gap-1")}>

        {showReviewActions && (

          <>

            <button

              type="button"

              disabled={pending || !canApprove}

              onClick={() => setApproveOpen(true)}

              className={cn(btnClass, "bg-teal/15 text-teal hover:bg-teal/25")}

              title={!canApprove ? "Η αγγελία δεν πληροί τις προϋποθέσεις έγκρισης" : undefined}

            >

              Έγκριση

            </button>

            <button

              type="button"

              disabled={pending}

              onClick={() => setRejectOpen(true)}

              className={cn(btnClass, "bg-red-500/10 text-red-600 hover:bg-red-500/20")}

            >

              Απόρριψη

            </button>

            <button

              type="button"

              disabled={pending}

              onClick={() => setChangesOpen(true)}

              className={cn(btnClass, "border border-gold/30 bg-gold/10 text-gold-dark hover:bg-gold/20")}

            >

              Αλλαγές

            </button>

          </>

        )}

        {showHide &&

          (isHidden ? (

            <button

              type="button"

              disabled={pending}

              onClick={() => run(() => adminRestoreListing(listingId))}

              className={cn(btnClass, "border border-border text-muted hover:text-charcoal")}

            >

              Επαναφορά

            </button>

          ) : (

            <button

              type="button"

              disabled={pending}

              onClick={() => run(() => adminHideListing(listingId))}

              className={cn(btnClass, "border border-border text-muted hover:text-charcoal")}

            >

              Απόκρυψη

            </button>

          ))}

        {ownerUserId && (

          <button

            type="button"

            disabled={pending}

            onClick={() => setSuspendOpen(true)}

            className={cn(btnClass, "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100")}

          >

            Αναστολή αγγελιοδότη

          </button>

        )}

      </div>



      {approveOpen && (

        <ModalShell title="Έγκριση αγγελίας" onClose={() => setApproveOpen(false)}>

          <p className="text-sm text-muted">

            Η αγγελία θα δημοσιευτεί και θα γίνει ορατή στους χρήστες. Θέλεις να συνεχίσεις;

          </p>

          <div className="mt-4 flex justify-end gap-2">

            <button

              type="button"

              onClick={() => setApproveOpen(false)}

              className="rounded-lg border border-border px-3 py-2 text-sm"

            >

              Ακύρωση

            </button>

            <button

              type="button"

              disabled={pending}

              onClick={() => run(() => adminApproveListing(listingId))}

              className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"

            >

              Έγκριση αγγελίας

            </button>

          </div>

        </ModalShell>

      )}



      {rejectOpen && (

        <ModalShell title="Απόρριψη αγγελίας" onClose={() => setRejectOpen(false)}>

          <label className="block text-sm">

            <span className="text-muted">Λόγος απόρριψης *</span>

            <textarea

              value={rejectReason}

              onChange={(e) => setRejectReason(e.target.value)}

              rows={4}

              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"

              placeholder="Εξήγησε γιατί απορρίπτεται η αγγελία"

            />

          </label>

          <div className="mt-4 flex justify-end gap-2">

            <button

              type="button"

              onClick={() => setRejectOpen(false)}

              className="rounded-lg border border-border px-3 py-2 text-sm"

            >

              Ακύρωση

            </button>

            <button

              type="button"

              disabled={pending || !rejectReason.trim()}

              onClick={() => run(() => adminRejectListing(listingId, rejectReason))}

              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"

            >

              Απόρριψη

            </button>

          </div>

        </ModalShell>

      )}



      {changesOpen && (

        <ModalShell

          title="Ζήτησε αλλαγές από τον αγγελιοδότη"

          onClose={() => setChangesOpen(false)}

        >

          <fieldset className="text-sm">

            <legend className="text-muted">Λόγοι αλλαγής *</legend>

            <ul className="mt-2 space-y-2">

              {ADMIN_CHANGE_REASONS.map((reason) => (

                <li key={reason.id}>

                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border px-3 py-2 hover:bg-sand/40">

                    <input

                      type="checkbox"

                      checked={changeReasonIds.includes(reason.id)}

                      onChange={() => toggleReason(reason.id)}

                      className="mt-0.5 accent-gold"

                    />

                    <span className="text-charcoal">{reason.label}</span>

                  </label>

                </li>

              ))}

            </ul>

          </fieldset>

          <label className="mt-4 block text-sm">

            <span className="text-muted">Σημείωση προς αγγελιοδότη *</span>

            <textarea

              value={changeNote}

              onChange={(e) => setChangeNote(e.target.value)}

              rows={4}

              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"

              placeholder="Περιγράψε τι πρέπει να διορθώσει ο αγγελιοδότης"

            />

          </label>

          <div className="mt-4 flex justify-end gap-2">

            <button

              type="button"

              onClick={() => setChangesOpen(false)}

              className="rounded-lg border border-border px-3 py-2 text-sm"

            >

              Ακύρωση

            </button>

            <button

              type="button"

              disabled={pending || !changeNote.trim() || changeReasonIds.length === 0}

              onClick={() =>

                run(() =>

                  adminRequestListingChanges(listingId, {

                    note: changeNote,

                    reasonIds: changeReasonIds,

                  })

                )

              }

              className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white disabled:opacity-50"

            >

              Αποστολή αιτήματος αλλαγών

            </button>

          </div>

        </ModalShell>

      )}



      {suspendOpen && ownerUserId && (

        <ModalShell

          title="Αναστολή αγγελιοδότη"

          onClose={() => setSuspendOpen(false)}

        >

          <p className="text-sm text-muted">

            Ο λογαριασμός του αγγελιοδότη θα ανασταλεί. Οι αγγελίες του μπορεί να παραμείνουν

            ορατές μέχρι περαιτέρω ενέργεια.

          </p>

          <label className="mt-3 block text-sm">

            <span className="text-muted">Σημείωση (προαιρετική)</span>

            <textarea

              value={suspendNote}

              onChange={(e) => setSuspendNote(e.target.value)}

              rows={3}

              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"

              placeholder="Εσωτερική σημείωση για την αναστολή"

            />

          </label>

          <div className="mt-4 flex justify-end gap-2">

            <button

              type="button"

              onClick={() => setSuspendOpen(false)}

              className="rounded-lg border border-border px-3 py-2 text-sm"

            >

              Ακύρωση

            </button>

            <button

              type="button"

              disabled={pending}

              onClick={() => run(() => adminSuspendUser(ownerUserId, suspendNote))}

              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"

            >

              Αναστολή αγγελιοδότη

            </button>

          </div>

        </ModalShell>

      )}

    </>

  );

}



function ModalShell({

  title,

  children,

  onClose,

}: {

  title: string;

  children: React.ReactNode;

  onClose: () => void;

}) {

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">

      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl">

        <div className="mb-3 flex items-start justify-between gap-3">

          <h3 className="font-display text-lg font-semibold text-charcoal">{title}</h3>

          <button type="button" onClick={onClose} className="text-muted hover:text-charcoal">

            ✕

          </button>

        </div>

        {children}

      </div>

    </div>

  );

}

