import type { HelpArticle } from "@/lib/assistant/knowledge-articles";
import { HELP_ARTICLES } from "@/lib/assistant/knowledge-articles";
import {
  classifyQuestion,
  OUT_OF_SCOPE_REPLY,
  retrieveHelpArticles,
  UNCERTAIN_REPLY,
  type AssistantCategory,
} from "@/lib/assistant/scope-classifier";
import {
  buildContextBlock,
  buildKnowledgeBlock,
  MIDORA_SUPPORT_SYSTEM_PROMPT,
  suggestActions,
  type AssistantAction,
  type AssistantContext,
} from "@/lib/assistant/support-context";
import {
  findFaqByQuestion,
  resolveFaqActionLinks,
  retrieveFaqsForMessage,
} from "@/lib/assistant/faq-index";
import { chatCompletion, isAiConfigured } from "@/lib/ai/openai";

export type AssistantChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatResult = {
  answer: string;
  actions: AssistantAction[];
  category: AssistantCategory;
  confidence: number;
  needsEscalation: boolean;
  sources: string[];
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buildFaqAnswer(item: ReturnType<typeof findFaqByQuestion>, context: AssistantContext): string {
  if (!item) return "";
  let answer = item.answer;
  if (item.category === "troubleshooting") {
    answer += "\n\nΑν το πρόβλημα συνεχίζεται, μπορώ να το στείλω στην υποστήριξη.";
  }
  if (item.category === "safety") {
    answer +=
      "\n\nΓια την ασφάλειά σου, επικοινώνησε μέσα από το Midora και επιβεβαίωσε τη διαθεσιμότητα πριν από οποιαδήποτε συμφωνία.";
  }
  return answer;
}

function mergeActions(
  categoryActions: AssistantAction[],
  faqItem: ReturnType<typeof findFaqByQuestion>,
  context: AssistantContext
): AssistantAction[] {
  const faqLinks = faqItem
    ? resolveFaqActionLinks(faqItem, context.listingId).map((link) => ({
        label: link.label,
        href: link.href,
      }))
    : [];
  const seen = new Set<string>();
  const merged: AssistantAction[] = [];
  for (const action of [...faqLinks, ...categoryActions]) {
    if (seen.has(action.href)) continue;
    seen.add(action.href);
    merged.push(action);
  }
  return merged.slice(0, 3);
}

function detectBookingPaymentQuestion(message: string): boolean {
  const text = normalize(message);
  return /κρατησ|booking|πληρωμ|payment|checkout|ολοκληρωσ|confirm.*reserv|refund|εγγυηση/.test(
    text
  );
}

function buildRuleBasedAnswer(message: string, articles: HelpArticle[]): string | null {
  const text = normalize(message);

  if (detectBookingPaymentQuestion(message)) {
    return "Το Midora δεν ολοκληρώνει κρατήσεις ή πληρωμές. Μπορείς να στείλεις αίτημα διαθεσιμότητας (βραχυχρόνια) ή αίτημα μίσθωσης (μηνιαία) στον ιδιοκτήτη. Η τελική διαθεσιμότητα και συμφωνία επιβεβαιώνονται από τον ιδιοκτήτη.";
  }

  if (/πρεπει.*ημερομην|υποχρεωτικ.*ημερομην|χωρις ημερομην/.test(text)) {
    const article = HELP_ARTICLES.find((a) => a.id === "search-dates");
    if (article) return article.content.split("\n").slice(0, 4).join("\n");
  }

  if (/κατοικιδ|pet/.test(text)) {
    const article = HELP_ARTICLES.find((a) => a.id === "search-guests-pets");
    if (article) return article.content;
  }

  if (/εξωφυλλο|κυρια φωτο|βασικ.*φωτο/.test(text)) {
    return "Για να αλλάξεις την κύρια φωτογραφία:\n\n1. Πήγαινε στις Αγγελίες μου.\n2. Άνοιξε την αγγελία.\n3. Μπες στην καρτέλα Φωτογραφίες.\n4. Πάτησε στις τρεις τελείες πάνω στη φωτογραφία.\n5. Επίλεξε Ορισμός ως εξώφυλλο.\n\nΗ φωτογραφία εξωφύλλου εμφανίζεται πρώτη στη δημόσια αγγελία και στα αποτελέσματα.";
  }

  if (/σειρα.*φωτο|drag|συρ/.test(text)) {
    return "Πήγαινε στις Αγγελίες μου, άνοιξε την αγγελία και μπες στις Φωτογραφίες. Εκεί μπορείς να σύρεις τις φωτογραφίες για να αλλάξεις σειρά.";
  }

  if (/airbnb|booking|vrbo/.test(text)) {
    const article = HELP_ARTICLES.find((a) => a.id === "external-links");
    if (article) return article.content;
  }

  if (/συνοικοδεσποτ|cohost/.test(text)) {
    const article = HELP_ARTICLES.find((a) => a.id === "owner-cohosts");
    if (article) return article.content;
  }

  if (articles.length > 0) {
    const top = articles[0];
    const lines = top.content.split("\n").filter(Boolean);
    if (lines.length <= 6) return top.content;
    return `${lines.slice(0, 2).join("\n")}\n\n${lines.slice(2).join("\n")}`;
  }

  return null;
}

function estimateConfidence(
  category: AssistantCategory,
  articles: HelpArticle[],
  answer: string
): number {
  if (category === "out_of_scope") return 1;
  if (category === "escalation_needed") return 0.4;
  if (articles.length === 0) return 0.3;
  if (answer.length < 40) return 0.5;
  if (articles.length >= 2) return 0.85;
  return 0.75;
}

export async function generateAssistantReply(
  message: string,
  history: AssistantChatMessage[],
  context: AssistantContext
): Promise<AssistantChatResult> {
  const category = classifyQuestion(message);
  const faqMatch = findFaqByQuestion(message);
  const faqArticles = retrieveFaqsForMessage(message, context, 4);
  const articles = retrieveHelpArticles(message, {
    pageType: context.currentRoute,
    limit: 4,
    context,
  });

  if (category === "out_of_scope") {
    return {
      answer: OUT_OF_SCOPE_REPLY,
      actions: [],
      category,
      confidence: 1,
      needsEscalation: false,
      sources: [],
    };
  }

  if (faqMatch) {
    const answer = buildFaqAnswer(faqMatch, context);
    return {
      answer,
      actions: mergeActions(suggestActions(category, context), faqMatch, context),
      category,
      confidence: 0.95,
      needsEscalation:
        faqMatch.category === "troubleshooting" || category === "escalation_needed",
      sources: [faqMatch.id],
    };
  }

  const ruleAnswer = buildRuleBasedAnswer(message, articles);
  const actions = mergeActions(suggestActions(category, context), null, context);
  const sources = [
    ...faqArticles.map((f) => f.id),
    ...articles.map((a) => a.id),
  ].filter((id, i, arr) => arr.indexOf(id) === i);
  const needsEscalation = category === "escalation_needed";

  if (needsEscalation && ruleAnswer) {
    return {
      answer: `${ruleAnswer}\n\nΑν το πρόβλημα συνεχίζεται, μπορώ να το στείλω στην υποστήριξη.`,
      actions,
      category,
      confidence: 0.6,
      needsEscalation: true,
      sources,
    };
  }

  if (needsEscalation) {
    return {
      answer:
        "Καταλαβαίνω. Πες μου τι προσπαθούσες να κάνεις και σε ποια σελίδα έγινε — μπορώ να το προωθήσω στην υποστήριξη.",
      actions,
      category,
      confidence: 0.5,
      needsEscalation: true,
      sources,
    };
  }

  const knowledgeBlock = buildKnowledgeBlock(articles);
  const contextBlock = buildContextBlock(context);

  if (!isAiConfigured()) {
    const fallback = ruleAnswer ?? (articles[0]?.content || UNCERTAIN_REPLY);
    const confidence = estimateConfidence(category, articles, fallback);
    return {
      answer: fallback,
      actions,
      category,
      confidence,
      needsEscalation: confidence < 0.45,
      sources,
    };
  }

  try {
    const aiAnswer = await chatCompletion(
      [
        { role: "system", content: MIDORA_SUPPORT_SYSTEM_PROMPT },
        {
          role: "system",
          content: `PAGE CONTEXT:\n${contextBlock}\n\nKNOWLEDGE BASE:\n${knowledgeBlock}`,
        },
        ...history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: message },
      ],
      { temperature: 0.3, maxTokens: 700 }
    );

    const answer = aiAnswer?.trim() || ruleAnswer || articles[0]?.content || UNCERTAIN_REPLY;
    const confidence = estimateConfidence(category, articles, answer);

    return {
      answer,
      actions,
      category,
      confidence,
      needsEscalation: confidence < 0.45 || needsEscalation,
      sources,
    };
  } catch (err) {
    console.error("[assistant/chat] AI failed:", err);
    const fallback = ruleAnswer ?? articles[0]?.content ?? UNCERTAIN_REPLY;
    return {
      answer: fallback,
      actions,
      category,
      confidence: 0.5,
      needsEscalation: false,
      sources,
    };
  }
}
