import { sendEmail } from "@/lib/email";

function inviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/dashboard/cohost-invite/${token}`;
}

export async function sendCohostInviteEmail(opts: {
  to: string;
  ownerName: string;
  listingTitle: string;
  inviteToken: string;
  message: string;
}): Promise<void> {
  const url = inviteUrl(opts.inviteToken);
  await sendEmail({
    to: opts.to,
    subject: `Πρόσκληση συνοικοδεσπότη — ${opts.listingTitle}`,
    html: `
      <p>Γεια σου,</p>
      <p>Ο/Η <strong>${opts.ownerName}</strong> σε προσκαλεί ως συνοικοδεσπότη για την αγγελία <strong>${opts.listingTitle}</strong> στο Midora.</p>
      <p>${opts.message}</p>
      <p><a href="${url}">Αποδοχή ή απόρριψη πρόσκλησης</a></p>
      <p>Αν δεν έχεις λογαριασμό, θα μπορείς να δημιουργήσεις έναν κατά την αποδοχή.</p>
    `,
  });
}

export async function sendCohostAcceptedEmail(opts: {
  to: string;
  cohostName: string;
  listingTitle: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Ο/Η ${opts.cohostName} αποδέχτηκε την πρόσκληση συνοικοδεσπότη`,
    html: `
      <p>Ο/Η <strong>${opts.cohostName}</strong> αποδέχτηκε την πρόσκληση συνοικοδεσπότη για την αγγελία <strong>${opts.listingTitle}</strong>.</p>
      <p>Μπορείς να διαχειριστείς τα δικαιώματα από τον χώρο διαχείρισης της αγγελίας.</p>
    `,
  });
}

export async function sendCohostRemovedEmail(opts: {
  to: string;
  listingTitle: string;
}): Promise<void> {
  await sendEmail({
    to: opts.to,
    subject: `Αφαίρεση πρόσβασης συνοικοδεσπότη — ${opts.listingTitle}`,
    html: `
      <p>Η πρόσβασή σου ως συνοικοδεσπότης για την αγγελία <strong>${opts.listingTitle}</strong> αφαιρέθηκε από τον ιδιοκτήτη.</p>
    `,
  });
}
