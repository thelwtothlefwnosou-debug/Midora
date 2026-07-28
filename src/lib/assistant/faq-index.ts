import { FAQ_COHOSTS } from "@/lib/assistant/faq-cohosts";
import { FAQ_EXTERNAL_LINKS } from "@/lib/assistant/faq-external-links";
import { FAQ_INQUIRIES } from "@/lib/assistant/faq-inquiries";
import { FAQ_LEGAL_AADE } from "@/lib/assistant/faq-legal-aade";
import { FAQ_OWNER_DASHBOARD } from "@/lib/assistant/faq-owner-dashboard";
import { FAQ_OWNER_LISTING } from "@/lib/assistant/faq-owner-listing";
import { FAQ_PHOTOS_AMENITIES } from "@/lib/assistant/faq-photos-amenities";
import { FAQ_PRICING_AVAILABILITY } from "@/lib/assistant/faq-pricing-availability";
import { FAQ_PROFILE } from "@/lib/assistant/faq-profile";
import { FAQ_PUBLIC_LISTING } from "@/lib/assistant/faq-public-listing";
import { FAQ_SAFETY } from "@/lib/assistant/faq-safety";
import { FAQ_SEARCH } from "@/lib/assistant/faq-search";
import { FAQ_TROUBLESHOOTING } from "@/lib/assistant/faq-troubleshooting";
import {
  FAQ_CATEGORY_LABELS,
  type FaqCategoryGroup,
  type FaqCategoryId,
  type FaqContextKey,
  type FaqItem,
} from "@/lib/assistant/faq-types";
import type { AssistantContext, AssistantPageType } from "@/lib/assistant/support-context";

export const MIDORA_FAQ_ITEMS: FaqItem[] = [
  ...FAQ_LEGAL_AADE,
  ...FAQ_SEARCH,
  ...FAQ_PUBLIC_LISTING,
  ...FAQ_INQUIRIES,
  ...FAQ_PRICING_AVAILABILITY,
  ...FAQ_PHOTOS_AMENITIES,
  ...FAQ_OWNER_LISTING,
  ...FAQ_OWNER_DASHBOARD,
  ...FAQ_COHOSTS,
  ...FAQ_EXTERNAL_LINKS,
  ...FAQ_PROFILE,
  ...FAQ_SAFETY,
  ...FAQ_TROUBLESHOOTING,
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[;?!.]/g, "")
    .trim();
}

function faqLabels(item: FaqItem): string[] {
  const labels = [item.question];
  if (item.suggestionLabel) labels.push(item.suggestionLabel);
  if (item.aliases?.length) labels.push(...item.aliases);
  return labels;
}

export function resolveFaqContextKey(context: AssistantContext): FaqContextKey {
  const tab = context.activeTab;
  if (context.pageType === "home") return "home";
  if (context.pageType === "public_search") return "public_search";
  if (context.pageType === "public_listing") return "public_listing";
  if (context.pageType === "owner_profile") return "owner_profile";
  if (tab === "photos") return "owner_photos";
  if (tab === "availability") return "owner_availability";
  if (tab === "inquiries" || tab === "messages") return "owner_messages";
  if (context.pageType === "owner_listing_workspace") return "owner_listing_workspace";
  if (context.pageType === "owner_dashboard") return "owner_dashboard";
  return "other";
}

function audienceMatches(
  item: FaqItem,
  userRole: AssistantContext["userRole"]
): boolean {
  if (item.audience === "all") return true;
  if (userRole === "guest" || userRole === "logged_in_user") {
    return item.audience === "visitor";
  }
  if (userRole === "cohost") {
    return item.audience === "cohost" || item.audience === "owner";
  }
  if (userRole === "owner" || userRole === "admin") {
    return item.audience === "owner" || item.audience === "cohost";
  }
  return true;
}

export function getContextualQuickSuggestions(
  context: AssistantContext,
  limit = 5
): string[] {
  const ctxKey = resolveFaqContextKey(context);
  const items = MIDORA_FAQ_ITEMS.filter(
    (item) =>
      item.quickSuggestion &&
      item.suggestionContexts.includes(ctxKey) &&
      audienceMatches(item, context.userRole)
  )
    .sort((a, b) => b.priority - a.priority);

  const seen = new Set<string>();
  const questions: string[] = [];
  for (const item of items) {
    const label = item.suggestionLabel ?? item.question;
    if (seen.has(label)) continue;
    seen.add(label);
    questions.push(label);
    if (questions.length >= limit) break;
  }
  return questions;
}

export function findFaqByQuestion(question: string): FaqItem | null {
  const norm = normalize(question.trim());
  if (!norm) return null;

  for (const item of MIDORA_FAQ_ITEMS) {
    for (const label of faqLabels(item)) {
      const labelNorm = normalize(label);
      if (labelNorm === norm) return item;
    }
  }

  const matches = MIDORA_FAQ_ITEMS.filter((item) =>
    faqLabels(item).some((label) => {
      const labelNorm = normalize(label);
      return labelNorm.includes(norm) || norm.includes(labelNorm);
    })
  ).sort((a, b) => b.priority - a.priority);

  return matches[0] ?? null;
}

export function retrieveFaqsForMessage(
  message: string,
  context?: AssistantContext,
  limit = 4
): FaqItem[] {
  const exact = findFaqByQuestion(message);
  if (exact) return [exact];

  const text = normalize(message);
  const ctxKey = context ? resolveFaqContextKey(context) : null;

  const scored = MIDORA_FAQ_ITEMS.map((item) => {
    let score = 0;
    const qNorm = normalize(item.question);
    if (text.length > 8 && (qNorm.includes(text) || text.includes(qNorm.slice(0, 20)))) {
      score += 8;
    }
    for (const kw of item.keywords ?? []) {
      if (text.includes(normalize(kw))) score += 3;
    }
    if (ctxKey && item.suggestionContexts.includes(ctxKey)) score += 2;
    if (context && audienceMatches(item, context.userRole)) score += 1;
    else if (!context) score += 0.5;
    if (context?.currentRoute) {
      for (const route of item.relatedRoutes) {
        if (context.currentRoute.startsWith(route) || route === context.currentRoute) {
          score += 1;
          break;
        }
      }
    }
    const words = text.split(/\s+/).filter((w) => w.length > 3);
    for (const word of words) {
      if (qNorm.includes(word) || normalize(item.answer).includes(word)) score += 0.5;
    }
    return { item, score };
  });

  return scored
    .filter((s) => s.score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

export function getFaqCategoryGroups(options?: {
  audience?: "visitor" | "owner" | "all";
}): FaqCategoryGroup[] {
  const audience = options?.audience ?? "all";
  const order: FaqCategoryId[] = [
    "search",
    "public_listing",
    "inquiries",
    "pricing_availability",
    "photos_amenities",
    "owner_listing",
    "owner_dashboard",
    "cohosts",
    "external_links",
    "profile",
    "safety",
    "troubleshooting",
  ];

  return order
    .map((id) => {
      const items = MIDORA_FAQ_ITEMS.filter((item) => {
        if (item.category !== id) return false;
        if (audience === "all") return true;
        if (audience === "visitor") {
          return item.audience === "visitor" || item.audience === "all";
        }
        return item.audience === "owner" || item.audience === "cohost" || item.audience === "all";
      }).sort((a, b) => b.priority - a.priority);
      if (items.length === 0) return null;
      return {
        id,
        title: FAQ_CATEGORY_LABELS[id],
        items,
      };
    })
    .filter((g): g is FaqCategoryGroup => g != null);
}

export function getHelpPageFaqGroups(): { title: string; faqs: { question: string; answer: string }[] }[] {
  return getFaqCategoryGroups({ audience: "all" }).map((group) => ({
    title: group.title,
    faqs: group.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  }));
}

export function faqItemsToHelpArticles(items: FaqItem[]) {
  return items.map((item) => ({
    id: item.id,
    title: item.question,
    category: item.category,
    audience: item.audience === "visitor" ? ("visitor" as const) : item.audience === "owner" ? ("owner" as const) : ("all" as const),
    routes: item.relatedRoutes,
    keywords: item.keywords ?? [],
    content: item.answer,
    lastUpdated: "2026-07-14",
  }));
}

export function resolveFaqActionLinks(
  item: FaqItem,
  listingId?: string
): { label: string; href: string }[] {
  if (!item.actionLinks?.length) return [];
  return item.actionLinks.map((link) => ({
    label: link.label,
    href: link.href.replace("{listingId}", listingId ?? ""),
  }));
}
