export type FaqAudience = "visitor" | "owner" | "cohost" | "all";

export type FaqCategoryId =
  | "search"
  | "public_listing"
  | "inquiries"
  | "pricing_availability"
  | "photos_amenities"
  | "owner_listing"
  | "owner_dashboard"
  | "cohosts"
  | "external_links"
  | "profile"
  | "safety"
  | "troubleshooting";

export const FAQ_CATEGORY_LABELS: Record<FaqCategoryId, string> = {
  search: "Αναζήτηση ακινήτου",
  public_listing: "Δημόσια αγγελία",
  inquiries: "Αιτήματα και επικοινωνία",
  pricing_availability: "Τιμές και διαθεσιμότητα",
  photos_amenities: "Φωτογραφίες και παροχές",
  owner_listing: "Ιδιοκτήτες / ανέβασμα αγγελίας",
  owner_dashboard: "Dashboard ιδιοκτήτη",
  cohosts: "Συνοικοδεσπότες",
  external_links: "Σύνδεσμοι αξιοπιστίας",
  profile: "Προφίλ και λογαριασμός",
  safety: "Ασφάλεια και εμπιστοσύνη",
  troubleshooting: "Τεχνικά προβλήματα",
};

/** Where quick-suggestion chips should appear. */
export type FaqContextKey =
  | "home"
  | "public_search"
  | "public_listing"
  | "owner_dashboard"
  | "owner_listing_workspace"
  | "owner_photos"
  | "owner_availability"
  | "owner_messages"
  | "owner_profile"
  | "other";

export type FaqActionLink = {
  label: string;
  href: string;
};

export type FaqItem = {
  id: string;
  question: string;
  /** Shorter label for quick-suggestion chips (defaults to question). */
  suggestionLabel?: string;
  /** Alternate phrasings matched when the user clicks a chip or types a variant. */
  aliases?: string[];
  answer: string;
  category: FaqCategoryId;
  audience: FaqAudience;
  relatedRoutes: string[];
  relatedFeature?: string;
  priority: number;
  quickSuggestion: boolean;
  suggestionContexts: FaqContextKey[];
  keywords?: string[];
  actionLinks?: FaqActionLink[];
};

export type FaqCategoryGroup = {
  id: FaqCategoryId;
  title: string;
  items: FaqItem[];
};
