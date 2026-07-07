import type { LucideIcon } from "lucide-react";

import {

  BadgeCheck,

  ClipboardCheck,

  GraduationCap,

  Headphones,

  Laptop,

  MessageCircle,

  Phone,

  Search,

  Send,

  ShieldCheck,

  Sun,

  Truck,

  Users,

  Home,

  CalendarDays,

  Building2,

  Palmtree,

} from "lucide-react";

import type { RentalType } from "@/lib/rental-types";



export type HomeTrustItem = {

  icon: LucideIcon;

  title: string;

  text: string;

};



export const HOME_TRUST_STRIP: HomeTrustItem[] = [

  {

    icon: ClipboardCheck,

    title: "Καθαρές αγγελίες",

    text: "Βασικά στοιχεία, φωτογραφίες και πληροφορίες μίσθωσης σε μία σελίδα.",

  },

  {

    icon: MessageCircle,

    title: "Απευθείας επικοινωνία",

    text: "Στείλε ενδιαφέρον και επικοινώνησε απευθείας με τον αγγελιοδότη.",

  },

  {

    icon: BadgeCheck,

    title: "Αριθμός καταχώρισης όπου απαιτείται",

    text: "Για βραχυχρόνιες αγγελίες εμφανίζεται ΑΜΑ, ΕΣΛ ή ΜΑΓ όπου προβλέπεται.",

  },

  {

    icon: ShieldCheck,

    title: "Βασικός έλεγχος πριν τη δημοσίευση",

    text: "Οι αγγελίες περνούν βασικό έλεγχο στοιχείων πριν εμφανιστούν δημόσια.",

  },

];



export type HomeFeatureCard = {

  icon: LucideIcon;

  title: string;

  text: string;

};



export type HomeStayNeed = {

  icon: LucideIcon;

  title: string;

  text: string;

  stay: string;

  rentalType?: RentalType;

};



export const HOME_STAY_NEEDS: HomeStayNeed[] = [

  {

    icon: CalendarDays,

    title: "Για σύντομη διαμονή",

    text: "Αγγελίες για λίγες ημέρες ή σύντομη παραμονή, με διαθεσιμότητα για ενημέρωση.",

    stay: "short_term",

    rentalType: "short_term",

  },

  {

    icon: GraduationCap,

    title: "Για φοιτητές",

    text: "Επιπλωμένα σπίτια για σπουδές, πρακτική ή μηνιαία διαμονή.",

    stay: "students",

  },

  {

    icon: Laptop,

    title: "Για εργασία / μετακίνηση",

    text: "Επιλογές για εργαζόμενους, αναπληρωτές ή ανθρώπους που μετακινούνται προσωρινά.",

    stay: "remote",

  },

  {

    icon: Truck,

    title: "Για μετακόμιση",

    text: "Μείνε προσωρινά μέχρι να βρεις τη μόνιμη βάση σου στην πόλη.",

    stay: "relocation",

  },

  {

    icon: Sun,

    title: "Για εποχική εργασία",

    text: "Αγγελίες για ανθρώπους που εργάζονται για συγκεκριμένη περίοδο σε άλλη πόλη ή περιοχή.",

    stay: "seasonal",

  },

  {

    icon: Palmtree,

    title: "Για διακοπές",

    text: "Βρες αγγελίες για διακοπές, σαββατοκύριακο ή λίγες ημέρες, με ενημερωτική διαθεσιμότητα.",

    stay: "vacation",

    rentalType: "short_term",

  },

];



export const HOME_WHY_MIDORA: HomeFeatureCard[] = [

  {

    icon: Home,

    title: "Για λίγες ημέρες ή για μήνες",

    text: "Βρες ακίνητο για σύντομη διαμονή ή για 2+ μήνες, ανάλογα με αυτό που ψάχνεις.",

  },

  {

    icon: ClipboardCheck,

    title: "Καθαρές πληροφορίες",

    text: "Δες τύπο μίσθωσης, τιμή, βασικά χαρακτηριστικά και διαθεσιμότητα πριν επικοινωνήσεις.",

  },

  {

    icon: MessageCircle,

    title: "Απευθείας επικοινωνία",

    text: "Στείλε ενδιαφέρον και συνεννοήσου απευθείας με τον αγγελιοδότη, χωρίς περιττά βήματα.",

  },

];



export type HomeStep = {

  icon: LucideIcon;

  title: string;

  text: string;

};



export const HOME_HOW_IT_WORKS: HomeStep[] = [

  {

    icon: Search,

    title: "Διάλεξε τύπο μίσθωσης",

    text: "Επίλεξε αν ψάχνεις βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή.",

  },

  {

    icon: Home,

    title: "Βρες ακίνητα",

    text: "Χρησιμοποίησε περιοχή, ημερομηνίες ή μήνα έναρξης για να βρεις αγγελίες που ταιριάζουν στην ανάγκη σου.",

  },

  {

    icon: CalendarDays,

    title: "Δες διαθεσιμότητα",

    text: "Στις αγγελίες μπορείς να δεις ενημερωτικά τη διαθεσιμότητα ή τις μη διαθέσιμες περιόδους.",

  },

  {

    icon: Phone,

    title: "Στείλε ενδιαφέρον",

    text: "Επικοινώνησε με τον αγγελιοδότη με τον τρόπο που έχει επιλέξει.",

  },

];



export type OwnerRentalCard = {

  title: string;

  text: string;

  rentalType: RentalType;

};



export const HOME_OWNER_RENTAL_CARDS: OwnerRentalCard[] = [

  {

    title: "Βραχυχρόνια αγγελία",

    text: "Κατάλληλη για σύντομες διαμονές. Απαιτείται αριθμός καταχώρισης όπου προβλέπεται.",

    rentalType: "short_term",

  },

  {

    title: "Μηνιαία / μεσοπρόθεσμη",

    text: "Ιδανική για 2+ μήνες, φοιτητές, εργασία ή προσωρινή μετακόμιση.",

    rentalType: "monthly",

  },

];



export type RentalTypeSearchTab = {

  value: RentalType;

  label: string;

  description: string;

};



export const RENTAL_TYPE_SEARCH_TABS: RentalTypeSearchTab[] = [

  {

    value: "short_term",

    label: "Βραχυχρόνια",

    description: "Για λίγες ημέρες ή σύντομη διαμονή.",

  },

  {

    value: "monthly",

    label: "Μηνιαία / μεσοπρόθεσμη",

    description: "Για 2+ μήνες, εργασία, σπουδές ή προσωρινή μετακόμιση.",

  },

];



export const HOME_SUPPORT_TRUST: HomeFeatureCard[] = [

  {

    icon: ShieldCheck,

    title: "Ασφαλής επικοινωνία",

    text: "Σαφή στοιχεία αγγελίας και απλή επικοινωνία με τον αγγελιοδότη.",

  },

  {

    icon: Headphones,

    title: "Υποστήριξη όταν χρειάζεται",

    text: "Βοήθεια πριν και κατά την επικοινωνία με τον αγγελιοδότη.",

  },

  {

    icon: ClipboardCheck,

    title: "Καθαροί όροι πριν την επικοινωνία",

    text: "Τύπος μίσθωσης, τιμή και τι περιλαμβάνεται — πριν στείλεις ενδιαφέρον.",

  },

];



/** @deprecated Use HOME_SUPPORT_TRUST */

export const HOME_COMPACT_TRUST = HOME_SUPPORT_TRUST;



export const HERO_IMAGE =

  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1920&q=80";



/** Owner listing flow — middleware redirects unauthenticated users to login. */

export { OWNER_LISTING_NEW_PATH as HOME_OWNER_LISTING_HREF } from "@/lib/owner-flow";


