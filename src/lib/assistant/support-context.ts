import { getContextualQuickSuggestions } from "@/lib/assistant/faq-index";
import type { AssistantCategory } from "@/lib/assistant/scope-classifier";

export type AssistantUserRole = "guest" | "logged_in_user" | "owner" | "cohost" | "admin";

export type AssistantPageType =
  | "home"
  | "public_search"
  | "public_listing"
  | "owner_dashboard"
  | "owner_listing_workspace"
  | "owner_profile"
  | "other";

export type AssistantContext = {
  currentRoute: string;
  pageType: AssistantPageType;
  userRole: AssistantUserRole;
  rentalMode?: "short_term" | "monthly" | "unknown";
  listingId?: string;
  listingTitle?: string;
  listingStatus?: string;
  activeTab?: string;
  searchParams?: Record<string, string>;
  selectedDates?: { checkIn?: string; checkOut?: string };
  guests?: number;
  pets?: number;
  browserUrl?: string;
  locale?: string;
};

export type AssistantAction = {
  label: string;
  href: string;
};

export const MIDORA_SUPPORT_SYSTEM_PROMPT = `You are Midora Βοηθός, the official support assistant for the Midora website. You only answer questions about Midora, its pages, its search, listings, owner dashboard, inquiries, messages, profiles, co-hosts, availability, pricing display, photos, amenities, and account usage. You must not answer unrelated general questions. If the question is outside Midora, politely say you can only help with Midora.

Midora is a property listing and inquiry platform only. Midora does not process bookings or payments for stays/rentals. Midora does not submit AADE declarations, provide tax/legal/accounting advice, insurance, damage protection, or compensation. Never say users can book, pay, checkout, or confirm a reservation through Midora. Never say Midora verifies damages or mediates compensation. Use 'στείλε αίτημα διαθεσιμότητας' for short-term listings and 'στείλε αίτημα μίσθωσης' for monthly listings.

For AADE/tax questions: give general platform information only, recommend consulting an accountant or AADE, and never claim Midora submits filings. If an AADE form asks for platform and the deal came from Midora, users may see an option like 'Άλλες ψηφιακές πλατφόρμες' and may mention Midora if the AADE app allows it. Do not tell users to pick Airbnb/Booking/Vrbo unless the agreement actually came from those platforms.

Use only the provided Midora knowledge base and current page context. Do not invent features. If something is not available, say it is not available yet or offer to contact support.

Answer in Greek unless the user uses another language. Be clear, calm, practical, and step-by-step when needed. Behave like a skilled human support agent. Keep answers concise unless steps are needed.`;

export function resolvePageType(pathname: string): AssistantPageType {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/listings") && pathname.split("/").length > 2) return "public_listing";
  if (pathname.startsWith("/listings")) return "public_search";
  if (pathname.match(/\/dashboard\/listings\/[^/]+/)) return "owner_listing_workspace";
  if (pathname.startsWith("/dashboard/profile")) return "owner_profile";
  if (pathname.startsWith("/dashboard")) return "owner_dashboard";
  return "other";
}

export function buildGreeting(context: AssistantContext): string {
  switch (context.pageType) {
    case "public_search":
      return "Γεια σου! Θέλεις βοήθεια με την αναζήτηση; Μπορώ να σου εξηγήσω τις ημερομηνίες, τους επισκέπτες, τα κατοικίδια, τα φίλτρα ή τον χάρτη.";
    case "public_listing":
      return "Γεια σου! Μπορώ να σε βοηθήσω να καταλάβεις την αγγελία, τη διαθεσιμότητα, τις παροχές ή πώς να στείλεις αίτημα στον ιδιοκτήτη.";
    case "owner_dashboard":
    case "owner_listing_workspace":
      return "Γεια σου! Μπορώ να σε βοηθήσω με φωτογραφίες, τιμές, διαθεσιμότητα, μηνύματα, δημοσίευση ή συνοικοδεσπότες.";
    case "owner_profile":
      return "Γεια σου! Μπορώ να σε βοηθήσω με τον λογαριασμό και το προφίλ σου στο Midora.";
    default:
      return "Γεια σου! Μπορώ να σε βοηθήσω με τη χρήση του Midora.";
  }
}

export function buildHeaderSubtitle(context: AssistantContext): string {
  switch (context.pageType) {
    case "public_search":
      return "Βοήθεια με αναζήτηση, ημερομηνίες και φίλτρα";
    case "public_listing":
      return "Βοήθεια για αυτή την αγγελία";
    case "owner_listing_workspace":
      return "Βοήθεια διαχείρισης αγγελίας";
    case "owner_dashboard":
      return "Βοήθεια διαχείρισης αγγελιών";
    case "owner_profile":
      return "Βοήθεια λογαριασμού";
    default:
      return "Ρώτησέ με για τη χρήση της πλατφόρμας";
  }
}

export const VISIBLE_CHIP_COUNT = 5;

export function getQuickSuggestions(context: AssistantContext): string[] {
  const fromFaq = getContextualQuickSuggestions(context, VISIBLE_CHIP_COUNT);
  if (fromFaq.length > 0) return fromFaq;
  return getLegacyQuickSuggestions(context);
}

function getLegacyQuickSuggestions(context: AssistantContext): string[] {
  switch (context.pageType) {
    case "public_search":
      return [
        "Πώς βάζω ημερομηνίες;",
        "Χρειάζεται να βάλω επισκέπτες;",
        "Πώς βάζω κατοικίδια;",
        "Πώς δουλεύει ο χάρτης;",
        "Γιατί βλέπω τιμή για 5 διανυκτερεύσεις;",
      ];
    case "public_listing":
      return [
        "Πώς στέλνω αίτημα;",
        "Τι σημαίνει η τιμή συνολικά;",
        "Πού βλέπω όλες τις φωτογραφίες;",
        "Πώς βλέπω αν επιτρέπονται κατοικίδια;",
        "Τι σημαίνει εξωτερικός σύνδεσμος;",
      ];
    case "owner_listing_workspace":
    case "owner_dashboard":
      return [
        "Πώς ανεβάζω φωτογραφίες;",
        "Πώς ορίζω εξώφυλλο;",
        "Πώς αλλάζω διαθεσιμότητα;",
        "Πώς αλλάζω τιμές;",
        "Πώς προσθέτω συνοικοδεσπότη;",
        "Πώς δημοσιεύω την αγγελία;",
      ];
    default:
      return [
        "Πώς κάνω αναζήτηση;",
        "Πώς στέλνω αίτημα;",
        "Πώς ανεβάζω αγγελία;",
      ];
  }
}

export function suggestActions(
  category: AssistantCategory,
  context: AssistantContext
): AssistantAction[] {
  const listingId = context.listingId;
  const actions: AssistantAction[] = [];

  if (context.userRole === "guest" || context.userRole === "logged_in_user") {
    if (category === "midora_public_search" || context.pageType === "home") {
      actions.push({ label: "Άνοιγμα αναζήτησης", href: "/listings?rentalType=short_term" });
    }
    if (context.pageType === "public_listing" && listingId) {
      actions.push({ label: "Προβολή αγγελίας", href: `/listings/${listingId}` });
    }
  }

  if (
    context.userRole === "owner" ||
    context.userRole === "cohost" ||
    context.userRole === "admin"
  ) {
    actions.push({ label: "Αγγελίες μου", href: "/dashboard/listings" });
    if (listingId) {
      if (category === "midora_messages" || context.activeTab === "inquiries") {
        actions.push({
          label: "Άνοιγμα αιτημάτων",
          href: `/dashboard/listings/${listingId}/inquiries`,
        });
      }
      if (category === "midora_external_links" || context.activeTab === "edit") {
        actions.push({
          label: "Άνοιγμα καταχώρισης",
          href: `/dashboard/listings/${listingId}/edit`,
        });
      }
      if (category === "midora_photos" || context.activeTab === "photos") {
        actions.push({
          label: "Άνοιγμα φωτογραφιών",
          href: `/dashboard/listings/${listingId}/photos`,
        });
      }
      if (category === "midora_availability" || context.activeTab === "availability") {
        actions.push({
          label: "Άνοιγμα διαθεσιμότητας",
          href: `/dashboard/listings/${listingId}/availability`,
        });
      }
      if (category === "midora_cohosts" || context.activeTab === "cohosts") {
        actions.push({
          label: "Συνοικοδεσπότες",
          href: `/dashboard/listings/${listingId}/cohosts`,
        });
      }
      if (category === "midora_owner_dashboard" || context.activeTab === "publish") {
        actions.push({
          label: "Δημοσίευση",
          href: `/dashboard/listings/${listingId}/publish`,
        });
      }
    }
    if (category === "midora_profile") {
      actions.push({ label: "Προφίλ", href: "/dashboard/profile" });
    }
  }

  return actions.slice(0, 3);
}

export function buildKnowledgeBlock(articles: { title: string; content: string }[]): string {
  if (articles.length === 0) return "Δεν βρέθηκαν σχετικά άρθρα βοήθειας.";
  return articles.map((a) => `## ${a.title}\n${a.content}`).join("\n\n");
}

export function buildContextBlock(context: AssistantContext): string {
  const lines = [
    `Route: ${context.currentRoute}`,
    `Page type: ${context.pageType}`,
    `User role: ${context.userRole}`,
  ];
  if (context.rentalMode) lines.push(`Rental mode: ${context.rentalMode}`);
  if (context.listingId) lines.push(`Listing ID: ${context.listingId}`);
  if (context.listingTitle) lines.push(`Listing title: ${context.listingTitle}`);
  if (context.activeTab) lines.push(`Active tab: ${context.activeTab}`);
  if (context.selectedDates?.checkIn) {
    lines.push(`Dates: ${context.selectedDates.checkIn} → ${context.selectedDates.checkOut ?? "?"}`);
  }
  if (context.guests) lines.push(`Guests: ${context.guests}`);
  if (context.pets) lines.push(`Pets: ${context.pets}`);
  return lines.join("\n");
}
