/**
 * Patch server-action files: Greek error strings → actionError() / authActionError().
 * Run: node scripts/patch-action-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

/** Order matters: longer / more specific strings first. */
const REPLACEMENTS = [
  ['return { error: "Η βάση δεν έχει ακόμα ενημερωθεί για περιήγηση ανά χώρο. Τρέξε migrations." }', 'return { error: await actionError("roomMigrationRequired") }'],
  ['error: "Η βάση δεν έχει ακόμα ενημερωθεί για περιήγηση ανά χώρο. Τρέξε migrations."', 'error: await actionError("roomMigrationRequired")'],
  ['return { error: "Η βάση δεν υποστηρίζει ακόμα λεζάντες. Τρέξε migrations." }', 'return { error: await actionError("captionMigrationRequired") }'],
  ['return { error: "Η βάση δεδομένων δεν έχει ακόμα external links. Τρέξε migrations." }', 'return { error: await actionError("externalLinksMigrationRequired") }'],
  ['return { error: "Η λειτουργία αποθηκευμένων αναζητήσεων δεν είναι ενεργή ακόμα. Τρέξε το SQL migration στο Supabase." }', 'return { error: await actionError("savedSearchesNotActive") }'],
  ['return { error: "Η αγγελία δεν βρέθηκε ή δεν έχεις δικαίωμα επεξεργασίας." }', 'return { error: await actionError("listingNotFoundOrNoEdit") }'],
  ['return { error: "Επιβεβαίωσε τον αριθμό τηλεφώνου με SMS πριν την υποβολή (απαιτείται για κλήσεις)." }', 'return { error: await actionError("phoneSmsVerifyRequired") }'],
  ['return { error: "Δεν ήταν δυνατή η αποθήκευση της φωτογραφίας στην αγγελία. Δοκίμασε ξανά." }', 'return { error: await actionError("photoSaveFailed") }'],
  ['return { error: "Δεν ήταν δυνατή η διαγραφή των φωτογραφιών. Δοκίμασε ξανά." }', 'return { error: await actionError("photosDeleteFailed") }'],
  ['return { error: "Δεν βρέθηκαν φωτογραφίες για διαγραφή." }', 'return { error: await actionError("photosNotFoundForDelete") }'],
  ['return { error: "Δεν ήταν δυνατή η διαγραφή της φωτογραφίας. Δοκίμασε ξανά." }', 'return { error: await actionError("photosDeleteFailed") }'],
  ['return { error: "Δεν ήταν δυνατή η αποθήκευση της περιόδου. Δοκίμασε ξανά." }', 'return { error: await actionError("periodSaveFailed") }'],
  ['return { error: "Δεν ήταν δυνατή η αποθήκευση της σειράς. Δοκίμασε ξανά." }', 'return { error: await actionError("orderSaveFailed") }'],
  ['return { error: "Δεν ήταν δυνατή η μεταφόρτωση της φωτογραφίας. Δοκίμασε ξανά." }', 'return { error: await actionError("photoUploadFailed") }'],
  ['return { error: "Η φωτογραφία είναι πολύ μεγάλη. Επίλεξε αρχείο έως 10 MB." }', 'return { error: await actionError("photoTooLarge") }'],
  ['return { error: "Συμπλήρωσε έγκυρο κινητό τηλέφωνο (Ελλάδα)." }', 'return { error: await actionError("validMobileRequired") }'],
  ['return { error: "Συμπλήρωσε τηλέφωνο ή email επικοινωνίας." }', 'return { error: await actionError("contactPhoneOrEmailRequired") }'],
  ['return { error: "Συμπλήρωσε από ποιον μήνα είναι διαθέσιμο." }', 'return { error: await actionError("availabilityMonthRequired") }'],
  ['return { error: "Μη έγκυρη επιλογή διαθεσιμότητας." }', 'return { error: await actionError("invalidAvailabilityStatus") }'],
  ['return { error: "Συμπλήρωσε ημερομηνίες από και έως." }', 'return { error: await actionError("datesRequired") }'],
  ['return { error: "Δεν μπορείς να δηλώσεις μη διαθεσιμότητα στο παρελθόν." }', 'return { error: await actionError("unavailablePastNotAllowed") }'],
  ['return { error: "Δεν ήταν δυνατή η αλλαγή. Δοκίμασε ξανά." }', 'return { error: await actionError("changeFailed") }'],
  ['return { error: "Οι συντεταγμένες πρέπει να είναι εντός Ελλάδας." }', 'return { error: await actionError("coordinatesOutsideGreece") }'],
  ['return { error: "Μη έγκυρες συντεταγμένες." }', 'return { error: await actionError("invalidCoordinates") }'],
  ['return { error: "Η αποστολή δεν είναι διαθέσιμη αυτή τη στιγμή." }', 'return { error: await actionError("sendUnavailable") }'],
  ['return { error: "Συμπλήρωσε email ή τηλέφωνο επικοινωνίας." }', 'return { error: await actionError("contactRequired") }'],
  ['return { error: "Η αγγελία δεν είναι διαθέσιμη." }', 'return { error: await actionError("listingUnavailable") }'],
  ['return { error: "Συμπλήρωσε το όνομά σου." }', 'return { error: await actionError("nameRequired") }'],
  ['return { error: "Το email δεν είναι έγκυρο." }', 'return { error: await actionError("invalidEmail") }'],
  ['return { error: "Απαιτείται λόγος απόρριψης." }', 'return { error: await actionError("rejectionReasonRequired") }'],
  ['return { error: "Συμπλήρωσε σημείωση προς τον αγγελιοδότη." }', 'return { error: await actionError("ownerNoteRequired") }'],
  ['return { error: "Η αναφορά δεν είναι διαθέσιμη αυτή τη στιγμή." }', 'return { error: await actionError("reportUnavailable") }'],
  ['return { error: "Συμπλήρωσε τον λόγο αναφοράς." }', 'return { error: await actionError("reportReasonRequired") }'],
  ['return { error: "Δεν ήταν δυνατή η υποβολή. Δοκίμασε ξανά." }', 'return { error: await actionError("submitFailed") }'],
  ['return { error: "Πρόσθεσε τουλάχιστον μία φωτογραφία." }', 'return { error: await actionError("minOnePhoto") }'],
  ['return { error: "Πρόσθεσε τουλάχιστον 1 φωτογραφία ή βίντεο" }', 'return { error: await actionError("minOnePhotoOrVideo") }'],
  ['return { error: "Το αρχείο βίντεο δεν είναι έγκυρο" }', 'return { error: await actionError("invalidVideoFile") }'],
  ['return { error: "Το βίντεο είναι πολύ μεγάλο (max 50MB)" }', 'return { error: await actionError("videoTooLarge") }'],
  ['return { error: "Το βίντεο είναι πολύ μεγάλο (max 50MB)." }', 'return { error: await actionError("videoTooLarge") }'],
  ['return { error: "Μπορείς μόνο 1 βίντεο ανά αγγελία" }', 'return { error: await actionError("oneVideoOnly") }'],
  ['return { error: "Δεν υπάρχει χώρος για βίντεο — μέγιστο 25 media" }', 'return { error: await actionError("noVideoSlot") }'],
  ['return { error: "Άκυρη αγγελία." }', 'return { error: await actionError("invalidListing") }'],
  ['return { error: "Άκυρη αγγελία", favorited: false }', 'return { error: await actionError("invalidListing"), favorited: false }'],
  ['return { error: "Άκυρη κατάσταση." }', 'return { error: await actionError("invalidStatus") }'],
  ['return { error: "Άκυρα φίλτρα" }', 'return { error: await actionError("invalidFilters") }'],
  ['return { error: validation.error ?? "Μη έγκυρο URL." }', 'return { error: validation.error ?? (await actionError("invalidUrl")) }'],
  ['return { error: "Η φωτογραφία δεν βρέθηκε." }', 'return { error: await actionError("photoNotFound") }'],
  ['return { error: "Η αγγελία δεν βρέθηκε." }', 'return { error: await actionError("listingNotFound") }'],
  ['return { error: "Η αγγελία δεν βρέθηκε." } as const', 'return { error: await actionError("listingNotFound") } as const'],
  ['return { error: "Η υπηρεσία δεν είναι διαθέσιμη." }', 'return { error: await actionError("serviceUnavailable") }'],
  ['return { error: "Η υπηρεσία δεν είναι διαθέσιμη." } as const', 'return { error: await actionError("serviceUnavailable") } as const'],
  ['return { error: "Supabase δεν είναι ρυθμισμένο" as const }', 'return { error: await authActionError("supabaseNotConfigured") } as const'],
  ['return { error: "Πρέπει να συνδεθείς" as const }', 'return (await mustSignInError()) as const'],
  ['return { error: "Πρέπει να συνδεθείς." } as const', 'return (await mustSignInError()) as const'],
  ['return { error: "Πρέπει να συνδεθείς." }', 'return await mustSignInError()'],
  ['return { error: "Πρέπει να συνδεθείς" }', 'return await mustSignInError()'],
  ['return { error: "Δεν έχεις δικαίωμα" as const }', 'return { error: await actionError("noPermission") } as const'],
  ['return { error: "Δεν έχεις πρόσβαση" as const }', 'return { error: await actionError("noAccess") } as const'],
  ['return { error: "Δεν έχεις πρόσβαση σε αυτή την αγγελία." }', 'return { error: await actionError("noAccess") }'],
  ['return { error: "Δεν έχεις το απαιτούμενο δικαίωμα για αυτή την ενέργεια." }', 'return { error: await actionError("noPermission") }'],
  ['return { error: auth.error ?? "Σφάλμα πρόσβασης" }', 'return { error: auth.error ?? (await actionError("accessError")) }'],
  ['return { error: "Συμπλήρωσε όνομα και τηλέφωνο" }', 'return { error: await authActionError("nameAndPhoneRequired") }'],
  ['return { error: "Μη έγκυρος χώρος." }', 'return { error: await actionError("invalidRoom") }'],
  ['return { error: "Δεν ήταν δυνατή η μετακίνηση της φωτογραφίας." }', 'return { error: await actionError("photoMoveFailed") }'],
  ['return { error: "Δεν ήταν δυνατή η ανάθεση χώρου." }', 'return { error: await actionError("roomAssignFailed") }'],
  ['return { error: "Δεν ήταν δυνατή η αποθήκευση της λεζάννας." }', 'return { error: await actionError("captionSaveFailed") }'],
  ['return { error: "Επίλεξε έγκυρο χώρο πριν ανεβάσεις φωτογραφίες." }', 'return { error: await actionError("validRoomBeforeUpload") }'],
  ['return { error: "Επίλεξε τουλάχιστον μία φωτογραφία." }', 'return { error: await actionError("selectAtLeastOnePhoto") }'],
  ['return { error: "Επίλεξε βίντεο." }', 'return { error: await actionError("selectVideo") }'],
  ['return { error: "Μη έγκυρο αρχείο βίντεο." }', 'return { error: await actionError("invalidVideoFile") }'],
  ['return { error: "Μπορείς μόνο 1 βίντεο ανά αγγελία." }', 'return { error: await actionError("oneVideoOnly") }'],
  ['return { error: "Δεν ήταν δυνατή η αποθήκευση των υπνοδωματίων." }', 'return { error: await actionError("bedroomsSaveFailed") }'],
  ['return { error: "Μπορείς να προσθέσεις έως 8 υπνοδωματίια." }', 'return { error: await actionError("maxBedrooms") }'],
  ['return { error: "Μπορείς να προσθέσεις έως 8 υπνοδωμάτια." }', 'return { error: await actionError("maxBedrooms") }'],
  ['return { error: "Επίλεξε μια φωτογραφία." }', 'return { error: await actionError("selectPhoto") }'],
  ['return { error: "Συμπλήρωσε το ονοματεπώνυμο." }', 'return { error: await actionError("profileFullNameRequired") }'],
  ['return { error: "Δώσε έγκυρο email συνοικοδεσπότη." }', 'return { error: await actionError("cohostValidEmail") }'],
  ['return { error: "Δεν μπορείς να προσκαλέσεις τον εαυτό σου." }', 'return { error: await actionError("cohostSelfInvite") }'],
  ['return { error: "Γράψε ένα μήνυμα απάντησης." }', 'return { error: await actionError("replyMessageRequired") }'],
  ['return { error: "Δώσε αριθμό τηλεφώνου." }', 'return { error: await actionError("phoneRequired") }'],
  ['return { error: "Το αίτημα δεν βρέθηκε." }', 'return { error: await actionError("leadNotFound") }'],
  ['return { error: "Δεν έχεις δικαίωμα απάντησης." }', 'return { error: await actionError("noPermissionReply") }'],
  ['return { error: "Δεν έχεις δικαίωμα." }', 'return { error: await actionError("noPermission") }'],
  ['return { error: "Υπάρχει ήδη πρόσκληση ή συνοικοδεσπότης με αυτό το email." }', 'return { error: await actionError("cohostDuplicateEmail") }'],
  ['return { error: "Η πρόσκληση δεν είναι εκκρεμής." }', 'return { error: await actionError("inviteNotPending") }'],
  ['return { error: "Ο λογαριασμός σου δεν έχει email." }', 'return { error: await actionError("accountNoEmail") }'],
  ['return { error: "Η πρόσκληση δεν βρέθηκε ή έχει λήξει." }', 'return { error: await actionError("inviteNotFoundOrExpired") }'],
  ['return { error: "Η πρόσκληση αφορά διαφορετικό email." }', 'return { error: await actionError("inviteWrongEmail") }'],
  ['return { error: "Η πρόσκληση δεν βρέθηκε." }', 'return { error: await actionError("inviteNotFound") }'],
  ['return { error: "Μη έγκυρος τύπος αγγελιοδότη." }', 'return { error: await actionError("invalidAdvertiserType") }'],
  ['return { error: "Μη έγκυρη προτίμηση επικοινωνίας." }', 'return { error: await actionError("invalidContactPreference") }'],
  ['return { error: "Αυτό το URL προφίλ χρησιμοποιείται ήδη από άλλον χρήστη." }', 'return { error: await actionError("profileSlugTaken") }'],
  ['return { error: "Συμπλήρωσε έγκυρη βασική τιμή ανά βράδυ." }', 'return { error: await actionError("pricingBaseRequired") }'],
  ['return { error: "Η εβδομαδιαία έκπτωση πρέπει να είναι 0–90%." }', 'return { error: await actionError("weeklyDiscountRange") }'],
  ['return { error: "Η μηνιαία έκπτωση πρέπει να είναι 0–90%." }', 'return { error: await actionError("monthlyDiscountRange") }'],
  ['return { error: "Συμπλήρωσε όνομα περιόδου." }', 'return { error: await actionError("periodNameRequired") }'],
  ['return { error: "Συμπλήρωσε ημερομηνίες." }', 'return { error: await actionError("pricingDatesRequired") }'],
  ['return { error: "Η λήξη πρέπει να είναι μετά την έναρξη." }', 'return { error: await actionError("pricingEndBeforeStart") }'],
  ['return { error: "Συμπλήρωσε έγκυρη τιμή." }', 'return { error: await actionError("periodPriceRequired") }'],
  ['return { error: "Συμπλήρωσε ημερομηνίες έναρξης και λήξης." }', 'return { error: await actionError("pricingDatesStartEndRequired") }'],
  ['return { error: "Η ημερομηνία λήξης πρέπει να είναι μετά την έναρξη." }', 'return { error: await actionError("pricingEndAfterStart") }'],
  ['return { error: "Συμπλήρωσε έγκυρη τιμή ανά βράδυ." }', 'return { error: await actionError("pricingNightPriceRequired") }'],
  ['return { error: "Υπάρχει επικάλυψη με άλλη περίοδο τιμολόγησης." }', 'return { error: await actionError("pricingOverlap") }'],
  ['return { error: "Η αποστολή SMS δεν είναι διαθέσιμη αυτή τη στιγμή. Δοκίμασε ξανά αργότερα ή επικοινώνησε με την υποστήριξη." }', 'return { error: await actionError("smsUnavailable") }'],
  ['return { error: "Έφτασες το όριο αποστολών κωδικού για αυτή την ώρα. Δοκίμασε αργότερα." }', 'return { error: await actionError("smsRateLimit") }'],
  ['return { error: "Πολλές αποτυχημένες προσπάθειες. Δοκίμασε ξανά αργότερα." }', 'return { error: await actionError("tooManyAttempts") }'],
  ['return { error: "Δεν ήταν δυνατή η αποστολή του κωδικού. Έλεγξε τον αριθμό και δοκίμασε ξανά." }', 'return { error: await actionError("smsSendFailed") }'],
  ['return { error: "Η επιβεβαίωση τηλεφώνου δεν είναι διαθέσιμη αυτή τη στιγμή." }', 'return { error: await actionError("phoneVerifyUnavailable") }'],
  ['return { error: "Στείλε πρώτα κωδικό στον αριθμό που θέλεις να επιβεβαιώσεις." }', 'return { error: await actionError("sendCodeFirst") }'],
  ['return { error: "Πολλές αποτυχημένες προσπάθειες. Ζήτησε νέο κωδικό." }', 'return { error: await actionError("tooManyAttempts") }'],
  ['return { error: "Ο κωδικός δεν είναι σωστός ή έληξε. Δοκίμασε ξανά." }', 'return { error: await actionError("wrongOrExpiredCode") }'],
  ['return { error: error?.message ?? "Δεν ήταν δυνατή η αποστολή της πρόσκλησης." }', 'return { error: error?.message ?? (await actionError("inviteSendFailed")) }'],
  ['overlapWarning: "Η περίοδος επικαλύπτεται με ήδη μη διαθέσιμες ημερομηνίες."', 'overlapWarning: await actionError("periodOverlapWarning")'],
  ['successMessage: "Η φωτογραφία προστέθηκε στην αγγελία."', 'successMessage: await actionError("photoAdded")'],
  ['return "Δεν ήταν δυνατή η αποθήκευση. Συμπλήρωσε το προφίλ σου από τις Ρυθμίσεις και δοκίμασε ξανά.";', 'return await actionError("profileFkSaveFailed");'],
  ['return "Συμπλήρωσε την τιμή ενοικίου στο βήμα «Τιμή & μίσθωση» (μεγαλύτερη από 0).";', 'return await actionError("rentPriceRequired");'],
  ['return "Ο μέγιστος αριθμός ατόμων πρέπει να είναι μεγαλύτερος από 0.";', 'return await actionError("maxGuestsRequired");'],
  ['return "Τα τετραγωνικά μέτρα πρέπει να είναι μεγαλύτερα από 0.";', 'return await actionError("sqmRequired");'],
  ['return "Δεν ήταν δυνατή η αποθήκευση της περιόδου. Δοκίμασε ξανά.";', 'return await actionError("periodSaveFailed");'],
  ['return error.message ?? "Δεν ήταν δυνατή η αποθήκευση της περιόδου. Δοκίμασε ξανά.";', 'return error.message ?? (await actionError("periodSaveFailed"));'],
];

const TEMPLATE_REPLACEMENTS = [
  {
    pattern: /return \{ error: `Πρόσθεσε τουλάχιστον \$\{MIN_LISTING_PHOTOS_FOR_REVIEW\} φωτογραφίες πριν την υποβολή\.` \}/g,
    replacement:
      'return { error: await actionError("minPhotosForReview", { count: MIN_LISTING_PHOTOS_FOR_REVIEW }) }',
  },
  {
    pattern: /return \{ error: `Μπορείς να ανεβάσεις έως \$\{MAX_LISTING_PHOTOS\} φωτογραφίες ανά αγγελία\.` \}/g,
    replacement: 'return { error: await actionError("maxPhotos", { count: MAX_LISTING_PHOTOS }) }',
  },
  {
    pattern: /return \{ error: `Μέγιστο \$\{MAX_LISTING_PHOTOS\} αρχεία \(φωτό \+ βίντεο\)` \}/g,
    replacement: 'return { error: await actionError("maxMediaFiles", { count: MAX_LISTING_PHOTOS }) }',
  },
  {
    pattern: /return \{ error: `Μέγιστο \$\{MAX_LISTING_PHOTOS\} αρχεία ανά αγγελία\.` \}/g,
    replacement: 'return { error: await actionError("maxFilesPerListing", { count: MAX_LISTING_PHOTOS }) }',
  },
  {
    pattern: /return \{ error: `Μέγιστο \$\{MAX_LISTING_PHOTOS\} αρχεία\.` \}/g,
    replacement: 'return { error: await actionError("maxFilesPerListing", { count: MAX_LISTING_PHOTOS }) }',
  },
  {
    pattern: /error: `Το βίντεο πρέπει να είναι έως \$\{MAX_VIDEO_DURATION_SECONDS\} δευτερόλεπτα`/g,
    replacement:
      'error: await actionError("videoMaxDuration", { seconds: MAX_VIDEO_DURATION_SECONDS })',
  },
  {
    pattern: /return \{ error: `Το βίντεο πρέπει να είναι έως \$\{MAX_VIDEO_DURATION_SECONDS\} δευτερόλεπτα\.` \}/g,
    replacement:
      'return { error: await actionError("videoMaxDuration", { seconds: MAX_VIDEO_DURATION_SECONDS }) }',
  },
  {
    pattern: /return \{ error: `Μπορείς να προσθέσεις έως \$\{MAX_COHOSTS_PER_LISTING\} συνοικοδεσπότες σε αυτή την αγγελία\.` \}/g,
    replacement:
      'return { error: await actionError("cohostMax", { count: MAX_COHOSTS_PER_LISTING }) }',
  },
  {
    pattern: /return \{ error: `Μπορείς να ζητήσεις νέο κωδικό σε \$\{waitSec\} δευτερόλεπτα\.` \}/g,
    replacement: 'return { error: await actionError("smsResendWait", { seconds: waitSec }) }',
  },
  {
    pattern: /return \{ error: `Η περιγραφή δεν μπορεί να υπερβαίνει τους \$\{PROFILE_BIO_MAX\} χαρακτήρες\.` \}/g,
    replacement: 'return { error: await actionError("bioTooLong", { max: PROFILE_BIO_MAX }) }',
  },
  {
    pattern: /return \{\s*error:\s*"Η ημερομηνία λήξης πρέπει να είναι ίδια ή μεταγενέστερη από την ημερομηνία έναρξης\.",\s*\}/g,
    replacement: 'return { error: await actionError("endDateBeforeStart") }',
  },
  {
    pattern: /"Η ημερομηνία λήξης πρέπει να είναι ίδια ή μεταγενέστερη από την ημερομηνία έναρξης\."/g,
    replacement: 'await actionError("endDateBeforeStart")',
  },
  {
    pattern: /listingTitle: listing\?\.title \?\? "Αγγελία"/g,
    replacement: 'listingTitle: listing?.title ?? (await actionError("listingFallback"))',
  },
  {
    pattern: /listingTitle: listing\?\.title \?\? "Αγγελία",/g,
    replacement: 'listingTitle: listing?.title ?? (await actionError("listingFallback")),',
  },
  {
    pattern: /\(invite\.listings as \{ title\?: string \} \| null\)\?\.title \?\? "Αγγελία"/g,
    replacement:
      '(invite.listings as { title?: string } | null)?.title ?? (await actionError("listingFallback"))',
  },
  {
    pattern: /: "Ο ιδιοκτήτης"/g,
    replacement: ': await actionError("ownerFallback")',
  },
  {
    pattern: /: "Χρήστης"/g,
    replacement: ': await actionError("userFallback")',
  },
  {
    pattern: /return `Ειδική τιμή \$\{startDate\}`/g,
    replacement: 'return await actionError("specialPriceLabel", { start: startDate })',
  },
  {
    pattern: /return `Ειδική τιμή \$\{startDate\} – \$\{endDate\}`/g,
    replacement:
      'return await actionError("specialPriceRangeLabel", { start: startDate, end: endDate })',
  },
  {
    pattern: /\? `Ειδική τιμή \$\{startDate\}`\s*: `Ειδική τιμή \$\{startDate\} – \$\{endDate\}`/g,
    replacement:
      '? await actionError("specialPriceLabel", { start: startDate }) : await actionError("specialPriceRangeLabel", { start: startDate, end: endDate })',
  },
];

const FILES = [
  "src/lib/actions.ts",
  "src/lib/listing-cohost-actions.ts",
  "src/lib/listing-photo-rooms.ts",
  "src/lib/listing-price-rules.ts",
  "src/lib/listing-sleeping-arrangements.ts",
  "src/lib/profile-page-actions.ts",
  "src/lib/profile-avatar-actions.ts",
  "src/lib/phone-verification.ts",
];

const IMPORT_LINE =
  'import { actionError, authActionError, mustSignInError } from "@/lib/action-error-i18n";';

for (const rel of FILES) {
  const file = path.join(root, rel);
  let src = fs.readFileSync(file, "utf8");
  let changed = false;

  for (const [from, to] of REPLACEMENTS) {
    if (src.includes(from)) {
      src = src.split(from).join(to);
      changed = true;
    }
  }

  for (const { pattern, replacement } of TEMPLATE_REPLACEMENTS) {
    if (pattern.test(src)) {
      src = src.replace(pattern, replacement);
      changed = true;
    }
  }

  if (!src.includes("action-error-i18n") && changed) {
    const useServer = src.indexOf('"use server"');
    if (useServer >= 0) {
      const lineEnd = src.indexOf("\n", useServer) + 1;
      src = src.slice(0, lineEnd) + "\n" + IMPORT_LINE + src.slice(lineEnd);
    } else {
      src = IMPORT_LINE + "\n" + src;
    }
  }

  if (changed) {
    fs.writeFileSync(file, src);
    console.log("patched", rel);
  } else {
    console.log("skipped (no changes)", rel);
  }
}

console.log("done");
