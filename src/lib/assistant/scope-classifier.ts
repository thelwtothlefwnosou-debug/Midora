import type { HelpArticle } from "@/lib/assistant/knowledge-articles";
import { HELP_ARTICLES } from "@/lib/assistant/knowledge-articles";
import {
  faqItemsToHelpArticles,
  retrieveFaqsForMessage,
} from "@/lib/assistant/faq-index";
import type { AssistantContext } from "@/lib/assistant/support-context";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export type AssistantCategory =
  | "midora_public_search"
  | "midora_listing_detail"
  | "midora_owner_dashboard"
  | "midora_photos"
  | "midora_availability"
  | "midora_pricing"
  | "midora_messages"
  | "midora_cohosts"
  | "midora_profile"
  | "midora_external_links"
  | "midora_troubleshooting"
  | "out_of_scope"
  | "escalation_needed";

const OUT_OF_SCOPE_PATTERNS = [
  /καιρ|weather|προγνωσ|βροχ|ηλιο|θερμοκρασ/,
  /πολιτικ|εκλογ|ποδοσφαι|μπασκετ/,
  /ιατρ|νοσο|φαρμακ|υγεια/,
  /νομικ|δικηγορ|φορολ|εργατικ/,
  /bitcoin|crypto|χρηματιστηρ|οικονομικ (?!.*midora)/,
  /συνταγ|μαγειρ|ταινι|σειρα|μουσικ/,
];

const ESCALATION_PATTERNS = [
  /ανθρωπ|υποστήριξ|support|βοηθεια απο|δεν λυθηκε|δεν λύθηκε/,
  /bug|σφαλμα|error|χαλασε|χάλασε|δεν δουλευει|δεν δουλεύει/,
  /εχασα|έχασα|χαθηκαν|χάθηκαν/,
  /δεν μπορω να μπω|δεν μπορώ να μπω|login|συνδεση/,
];

const CATEGORY_KEYWORDS: Record<AssistantCategory, RegExp[]> = {
  midora_public_search: [
    /αναζητ|search|φιλτρ|χαρτ|map|ημερομην|guest|επισκεπτ|κατοικιδ|pet|βραχυχρον|μηνιαι/,
  ],
  midora_listing_detail: [
    /αγγελια|listing|αιτημα|inquiry|διαθεσιμοτητα|τιμη|φωτογραφ|gallery|παροχ|amenit/,
  ],
  midora_photos: [/φωτογραφ|εξωφυλλο|cover|upload|ανεβασ|σειρα φωτο/],
  midora_availability: [/διαθεσιμοτητα|availability|ημερολογ|μπλοκ|κλεισ/],
  midora_pricing: [/τιμη|pricing|νυχτα|μηνα|εκπτωσ|σαββατοκυριακ/],
  midora_messages: [/μηνυμα|αιτημα|inquiry|message|απαντ/],
  midora_cohosts: [/συνοικοδεσποτ|cohost/],
  midora_profile: [/προφιλ|profile|λογαριασμ|account|τηλεφων/],
  midora_external_links: [/airbnb|booking|vrbo|εξωτερικ|link|συνδεσμ/],
  midora_owner_dashboard: [/dashboard|αγγελιες μου|δημοσιευ|publish|ανεβασ αγγελ/],
  midora_troubleshooting: [/δεν|κολλησε|σφαλμα|bug|χαλα|εμφανιζ|αποθηκευ/],
  out_of_scope: [],
  escalation_needed: [],
};

export function classifyQuestion(message: string): AssistantCategory {
  const text = normalize(message);

  if (OUT_OF_SCOPE_PATTERNS.some((re) => re.test(text))) {
    const midoraRelated =
      /midora|αγγελ|ακινητ|dashboard|αναζητ|listing|ενοικ|διαμον/.test(text);
    if (!midoraRelated) return "out_of_scope";
  }

  if (ESCALATION_PATTERNS.some((re) => re.test(text))) {
    return "escalation_needed";
  }

  let best: AssistantCategory = "midora_public_search";
  let bestScore = 0;

  for (const [category, patterns] of Object.entries(CATEGORY_KEYWORDS) as [
    AssistantCategory,
    RegExp[],
  ][]) {
    if (category === "out_of_scope" || category === "escalation_needed") continue;
    const score = patterns.filter((re) => re.test(text)).length;
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best;
}

export function retrieveHelpArticles(
  message: string,
  options?: { pageType?: string; limit?: number; context?: AssistantContext }
): HelpArticle[] {
  const text = normalize(message);
  const category = classifyQuestion(message);
  const limit = options?.limit ?? 4;

  const faqArticles = faqItemsToHelpArticles(
    retrieveFaqsForMessage(message, options?.context, limit)
  );

  const scored = HELP_ARTICLES.map((article) => {
    let score = 0;
    if (article.category === category) score += 3;
    if (options?.pageType && article.routes.some((r) => options.pageType!.includes(r))) {
      score += 2;
    }
    for (const kw of article.keywords) {
      if (text.includes(normalize(kw))) score += 2;
    }
    for (const word of text.split(/\s+/).filter((w) => w.length > 3)) {
      if (normalize(article.content).includes(word)) score += 0.5;
    }
    return { article, score };
  });

  const legacy = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);

  const merged: HelpArticle[] = [];
  const seen = new Set<string>();
  for (const article of [...faqArticles, ...legacy]) {
    if (seen.has(article.id)) continue;
    seen.add(article.id);
    merged.push(article);
    if (merged.length >= limit) break;
  }
  return merged;
}

export const OUT_OF_SCOPE_REPLY =
  "Μπορώ να βοηθήσω μόνο με ερωτήσεις που αφορούν το Midora. Μπορώ να σου δείξω πώς να κάνεις αναζήτηση, να στείλεις αίτημα ή να διαχειριστείς την αγγελία σου.";

export const UNCERTAIN_REPLY =
  "Δεν έχω αρκετές πληροφορίες για να το απαντήσω με σιγουριά. Μπορώ να το προωθήσω στην υποστήριξη του Midora.";

export const FEATURE_UNAVAILABLE_REPLY =
  "Αυτή η λειτουργία δεν είναι διαθέσιμη ακόμα στο Midora.";
