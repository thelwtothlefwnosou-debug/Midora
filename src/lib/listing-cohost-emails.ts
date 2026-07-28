import { sendEmail } from "@/lib/email";

import { pickLocale } from "@/lib/locale-fallbacks";



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

  locale?: string;

}): Promise<void> {

  const url = inviteUrl(opts.inviteToken);

  const locale = opts.locale;

  const subject = pickLocale(

    locale,

    `Πρόσκληση συνοικοδεσπότη — ${opts.listingTitle}`,

    `Co-host invitation — ${opts.listingTitle}`

  );

  const greeting = pickLocale(locale, "Γεια σου,", "Hello,");

  const body = pickLocale(

    locale,

    `Ο/Η <strong>${opts.ownerName}</strong> σε προσκαλεί ως συνοικοδεσπότη για την αγγελία <strong>${opts.listingTitle}</strong> στο Midora.`,

    `<strong>${opts.ownerName}</strong> invited you as co-host for listing <strong>${opts.listingTitle}</strong> on Midora.`

  );

  const cta = pickLocale(locale, "Αποδοχή ή απόρριψη πρόσκλησης", "Accept or decline invitation");

  const signup = pickLocale(

    locale,

    "Αν δεν έχεις λογαριασμό, θα μπορείς να δημιουργήσεις έναν κατά την αποδοχή.",

    "If you don't have an account yet, you can create one when accepting."

  );



  await sendEmail({

    to: opts.to,

    subject,

    html: `

      <p>${greeting}</p>

      <p>${body}</p>

      <p>${opts.message}</p>

      <p><a href="${url}">${cta}</a></p>

      <p>${signup}</p>

    `,

  });

}



export async function sendCohostAcceptedEmail(opts: {

  to: string;

  cohostName: string;

  listingTitle: string;

  locale?: string;

}): Promise<void> {

  const locale = opts.locale;

  const subject = pickLocale(

    locale,

    `Ο/Η ${opts.cohostName} αποδέχτηκε την πρόσκληση συνοικοδεσπότη`,

    `${opts.cohostName} accepted the co-host invitation`

  );

  const body = pickLocale(

    locale,

    `Ο/Η <strong>${opts.cohostName}</strong> αποδέχτηκε την πρόσκληση συνοικοδεσπότη για την αγγελία <strong>${opts.listingTitle}</strong>.`,

    `<strong>${opts.cohostName}</strong> accepted the co-host invitation for listing <strong>${opts.listingTitle}</strong>.`

  );

  const next = pickLocale(

    locale,

    "Μπορείς να διαχειριστείς τα δικαιώματα από τον χώρο διαχείρισης της αγγελίας.",

    "You can manage permissions from the listing workspace."

  );



  await sendEmail({

    to: opts.to,

    subject,

    html: `

      <p>${body}</p>

      <p>${next}</p>

    `,

  });

}



export async function sendCohostRemovedEmail(opts: {

  to: string;

  listingTitle: string;

  locale?: string;

}): Promise<void> {

  const locale = opts.locale;

  const subject = pickLocale(

    locale,

    `Αφαίρεση πρόσβασης συνοικοδεσπότη — ${opts.listingTitle}`,

    `Co-host access removed — ${opts.listingTitle}`

  );

  const body = pickLocale(

    locale,

    `Η πρόσβασή σου ως συνοικοδεσπότης για την αγγελία <strong>${opts.listingTitle}</strong> αφαιρέθηκε από τον ιδιοκτήτη.`,

    `Your co-host access for listing <strong>${opts.listingTitle}</strong> was removed by the owner.`

  );



  await sendEmail({

    to: opts.to,

    subject,

    html: `<p>${body}</p>`,

  });

}


