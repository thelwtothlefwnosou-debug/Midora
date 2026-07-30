"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Headphones,
  MessageCircle,
  Minus,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  AssistantMessageContent,
  AssistantTypingIndicator,
} from "@/components/assistant/AssistantMessageContent";
import {
  HelpAssistantProvider,
  useHelpAssistant,
} from "@/components/assistant/HelpAssistantContext";
import {
  buildGreeting,
  buildHeaderSubtitle,
  getQuickSuggestions,
  resolvePageType,
  VISIBLE_CHIP_COUNT,
  type AssistantAction,
  type AssistantContext,
} from "@/lib/assistant/support-context";
import { resolveListingWorkspaceTab } from "@/lib/listing-workspace-nav";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AssistantAction[];
  category?: string;
  feedbackGiven?: boolean;
  escalationOffer?: boolean;
};

type ChatResponse = {
  answer?: string;
  actions?: AssistantAction[];
  category?: string;
  confidence?: number;
  needsEscalation?: boolean;
  error?: boolean;
};

const LOADING_PHRASES = ["Το κοιτάζω", "Μισό λεπτό, το ελέγχω"] as const;

function newMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function MidoraHelpWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { open, seedQuestion, openHelp, closeHelp } = useHelpAssistant();
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPhrase] = useState(
    () => LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)]
  );
  const [error, setError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [showAllChips, setShowAllChips] = useState(false);
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);
  const [supportDescription, setSupportDescription] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [feedbackFollowUpId, setFeedbackFollowUpId] = useState<string | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [conversationId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const seededRef = useRef(false);

  const listingId = useMemo(() => {
    const publicMatch = pathname.match(/\/listings\/([^/]+)/);
    const ownerMatch = pathname.match(/\/dashboard\/listings\/([^/]+)/);
    const id = ownerMatch?.[1] ?? publicMatch?.[1];
    if (!id || ["new", "edit", "photos", "pay"].includes(id)) return undefined;
    return id;
  }, [pathname]);

  const pageContext = useMemo((): AssistantContext => {
    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });
    const rentalType = params.rentalType;
    return {
      currentRoute: pathname,
      pageType: resolvePageType(pathname),
      userRole: pathname.startsWith("/dashboard") ? "owner" : "guest",
      rentalMode:
        rentalType === "short_term" || rentalType === "monthly"
          ? rentalType
          : "unknown",
      listingId,
      activeTab:
        listingId && pathname.includes("/dashboard/listings/")
          ? resolveListingWorkspaceTab(pathname, listingId)
          : undefined,
      searchParams: Object.keys(params).length ? params : undefined,
      selectedDates: {
        checkIn: params.interestFrom ?? params.checkIn ?? params.start,
        checkOut: params.interestTo ?? params.checkOut ?? params.end,
      },
      guests: params.guests ? parseInt(params.guests, 10) : undefined,
      pets: params.pets ? parseInt(params.pets, 10) : undefined,
      browserUrl: typeof window !== "undefined" ? window.location.href : undefined,
      locale: "el",
    };
  }, [listingId, pathname, searchParams]);

  const greeting = useMemo(() => buildGreeting(pageContext), [pageContext]);
  const headerSubtitle = useMemo(() => buildHeaderSubtitle(pageContext), [pageContext]);
  const suggestions = useMemo(() => getQuickSuggestions(pageContext), [pageContext]);
  const visibleChips = showAllChips
    ? suggestions
    : suggestions.slice(0, VISIBLE_CHIP_COUNT);
  const hasMoreChips = suggestions.length > VISIBLE_CHIP_COUNT;

  const isSearchPage = pathname.startsWith("/listings") && !listingId;
  // Phone (≤639): clear fixed bottom nav + iOS safe-area. ≥640 unchanged (sm:bottom-6 still applies).
  const fabBottomClass =
    pathname === "/"
      ? "bottom-24 max-[639px]:bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))]"
      : isSearchPage
        ? "bottom-20 max-[639px]:bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))]"
        : "bottom-5";

  useEffect(() => {
    if (!open || minimized) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (escalationOpen) setEscalationOpen(false);
        else closeHelp();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeHelp, escalationOpen, minimized, open]);

  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, open, minimized, escalationOpen]);

  useEffect(() => {
    if (open && !minimized) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 120);
      return () => window.clearTimeout(t);
    }
  }, [minimized, open]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: newMessageId(),
        role: "user",
        content: trimmed,
      };

      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);
      setLastFailedText(null);
      setFeedbackFollowUpId(null);

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            context: pageContext,
            conversationId,
          }),
        });

        const data = (await res.json()) as ChatResponse;

        if (!res.ok && !data.answer) {
          throw new Error("Αποτυχία αιτήματος");
        }

        const assistantMsg: ChatMessage = {
          id: newMessageId(),
          role: "assistant",
          content:
            data.answer?.trim() ||
            "Δεν μπόρεσα να απαντήσω. Δοκίμασε ξανά.",
          actions: data.actions,
          category: data.category,
        };

        if (data.needsEscalation) {
          assistantMsg.escalationOffer = true;
        }

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setLastFailedText(trimmed);
        setError(
          "Δεν μπόρεσα να απαντήσω αυτή τη στιγμή. Δοκίμασε ξανά ή στείλε το στην υποστήριξη."
        );
      } finally {
        setLoading(false);
      }
    },
    [conversationId, loading, messages, pageContext]
  );

  useEffect(() => {
    if (!open || !seedQuestion || seededRef.current) return;
    seededRef.current = true;
    setMinimized(false);
    void sendText(seedQuestion);
  }, [open, seedQuestion, sendText]);

  useEffect(() => {
    if (!open) {
      seededRef.current = false;
      setMinimized(false);
    }
  }, [open]);

  async function submitFeedback(
    messageId: string,
    helpful: boolean,
    question?: string,
    comment?: string
  ) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedbackGiven: true } : m))
    );
    setFeedbackFollowUpId(null);
    setFeedbackComment("");

    await fetch("/api/assistant/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversationId,
        messageId,
        helpful,
        comment: comment?.trim() || undefined,
        question,
        route: pathname,
      }),
    }).catch(() => undefined);

    if (!helpful) {
      setEscalationOpen(true);
      if (!supportDescription.trim() && question) {
        setSupportDescription(`Δεν βοήθησε η απάντηση για: ${question}`);
      }
    }
  }

  async function submitSupport(e: React.FormEvent) {
    e.preventDefault();
    if (supportSending) return;
    setSupportSending(true);

    try {
      const res = await fetch("/api/assistant/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: supportDescription,
          email: supportEmail || undefined,
          pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
          listingId,
          conversationSummary: messages
            .slice(-8)
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n"),
        }),
      });

      const data = (await res.json()) as { ticketId?: string; message?: string; error?: string };
      if (!res.ok) throw new Error(data.error);

      setTicketCreated(data.ticketId ?? "OK");
      setEscalationOpen(false);
      setSupportDescription("");
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId(),
          role: "assistant",
          content:
            data.message ??
            "Το στείλαμε στην υποστήριξη του Midora. Θα σε ενημερώσουμε μόλις υπάρχει απάντηση.",
        },
      ]);
    } catch {
      setError("Δεν ήταν δυνατή η αποστολή. Δοκίμασε ξανά.");
    } finally {
      setSupportSending(false);
    }
  }

  function clearConversation() {
    setMessages([]);
    setError(null);
    setEscalationOpen(false);
    setTicketCreated(null);
    setSupportDescription("");
    setShowAllChips(false);
    setFeedbackFollowUpId(null);
    setLastFailedText(null);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText(input);
    }
  }

  function openPanel() {
    setMinimized(false);
    openHelp();
  }

  const panelVisible = open && !minimized;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => openPanel()}
          title="Ρώτησέ με για το Midora"
          className={cn(
            "assistant-fab group fixed right-4 z-40 flex items-center justify-center gap-2 rounded-full border border-charcoal/10 bg-charcoal text-white",
            "shadow-[0_6px_24px_-6px_rgba(26,26,26,0.45)] transition-all hover:shadow-[0_8px_28px_-6px_rgba(26,26,26,0.5)] hover:scale-[1.02]",
            "h-11 w-11 sm:bottom-6 sm:right-6 sm:h-auto sm:min-h-10 sm:w-auto sm:px-3.5 sm:py-2",
            fabBottomClass
          )}
          aria-label="Βοηθός Midora"
        >
          <MessageCircle className="h-4 w-4 shrink-0 text-gold-light" />
          <span className="hidden text-sm font-medium sm:inline">Βοηθός</span>
        </button>
      )}

      {open && minimized && (
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className={cn(
            "fixed right-4 z-[120] flex items-center gap-2 rounded-full border border-charcoal/10 bg-white px-3.5 py-2 text-sm font-medium text-charcoal shadow-[0_8px_32px_-8px_rgba(26,26,26,0.2)]",
            "sm:bottom-6 sm:right-6",
            fabBottomClass
          )}
        >
          <Sparkles className="h-4 w-4 text-gold" />
          Βοηθός Midora
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
      )}

      {panelVisible && (
        <>
          {/* Mobile: light scrim only */}
          <button
            type="button"
            aria-label="Κλείσιμο"
            className="fixed inset-0 z-[119] bg-charcoal/12 sm:hidden"
            onClick={closeHelp}
          />

          <div
            role="dialog"
            aria-label="Βοηθός Midora"
            className={cn(
              "assistant-panel fixed z-[120] flex flex-col overflow-hidden border border-charcoal/10 bg-white",
              "inset-0 h-[100dvh] max-h-[100dvh] rounded-none shadow-none",
              "sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(72vh,680px)] sm:max-h-[72vh] sm:w-[min(420px,calc(100vw-2rem))] sm:rounded-[22px]",
              "sm:shadow-[0_20px_60px_-12px_rgba(26,26,26,0.22)]"
            )}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-charcoal/8 bg-gradient-to-b from-sand/40 to-white px-4 py-3.5 sm:px-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-gold-light">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-display text-[15px] font-semibold leading-tight text-charcoal sm:text-base">
                      Βοηθός Midora
                    </h2>
                    <p className="truncate text-[11px] text-muted sm:text-xs">{headerSubtitle}</p>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setEscalationOpen(true)}
                  className="hidden rounded-lg p-2 text-muted hover:bg-sand/60 hover:text-charcoal sm:inline-flex"
                  title="Υποστήριξη"
                  aria-label="Υποστήριξη"
                >
                  <Headphones className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={clearConversation}
                  className="rounded-lg p-2 text-muted hover:bg-sand/60 hover:text-charcoal"
                  aria-label="Καθαρισμός συνομιλίας"
                  title="Καθαρισμός"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  className="hidden rounded-lg p-2 text-muted hover:bg-sand/60 hover:text-charcoal sm:inline-flex"
                  aria-label="Ελαχιστοποίηση"
                  title="Ελαχιστοποίηση"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={closeHelp}
                  className="rounded-lg p-2 text-muted hover:bg-sand/60 hover:text-charcoal"
                  aria-label="Κλείσιμο"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-4 sm:px-4">
                {messages.length === 0 && !loading && (
                  <div className="space-y-3.5">
                    <div className="rounded-2xl border border-charcoal/8 bg-cream/50 px-3.5 py-3">
                      <p className="text-[13px] leading-relaxed text-charcoal/90 sm:text-sm">
                        {greeting}
                      </p>
                    </div>
                    <div>
                      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">
                        Συχνές ερωτήσεις
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
                        {visibleChips.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => void sendText(s)}
                            className="shrink-0 rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-xs font-medium text-charcoal/85 transition-colors hover:border-gold/40 hover:bg-sand/50"
                          >
                            {s}
                          </button>
                        ))}
                        {hasMoreChips && !showAllChips && (
                          <button
                            type="button"
                            onClick={() => setShowAllChips(true)}
                            className="shrink-0 rounded-full border border-dashed border-charcoal/15 px-3 py-1.5 text-xs font-medium text-muted hover:text-charcoal"
                          >
                            Περισσότερα
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const prevUser =
                    msg.role === "assistant"
                      ? [...messages.slice(0, index)].reverse().find((m) => m.role === "user")
                      : undefined;

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col",
                        msg.role === "user" ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[92%] sm:max-w-[88%]",
                          msg.role === "user"
                            ? "rounded-2xl rounded-br-md bg-charcoal px-3.5 py-2.5 text-white"
                            : "rounded-2xl rounded-bl-md border border-charcoal/8 bg-white px-3.5 py-3 shadow-[0_1px_0_rgba(26,26,26,0.04)]"
                        )}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed sm:text-sm">
                            {msg.content}
                          </p>
                        ) : (
                          <AssistantMessageContent content={msg.content} />
                        )}

                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-charcoal/6 pt-2.5">
                            {msg.actions.map((action) => (
                              <Link
                                key={action.href}
                                href={action.href}
                                onClick={closeHelp}
                                className="inline-flex min-h-8 items-center rounded-lg bg-gold/10 px-2.5 text-xs font-semibold text-gold-dark transition-colors hover:bg-gold/18"
                              >
                                {action.label}
                              </Link>
                            ))}
                          </div>
                        )}

                        {msg.escalationOffer && !escalationOpen && !ticketCreated && (
                          <div className="mt-3 flex flex-wrap gap-2 border-t border-charcoal/6 pt-2.5">
                            <p className="w-full text-xs text-muted">
                              Θέλεις να το στείλω στην υποστήριξη του Midora;
                            </p>
                            <button
                              type="button"
                              onClick={() => setEscalationOpen(true)}
                              className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-dark"
                            >
                              Ναι, στείλε το
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setMessages((prev) =>
                                  prev.map((m) =>
                                    m.id === msg.id ? { ...m, escalationOffer: false } : m
                                  )
                                )
                              }
                              className="rounded-lg border border-charcoal/12 px-3 py-1.5 text-xs text-muted"
                            >
                              Όχι τώρα
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.role === "assistant" && !msg.feedbackGiven && !msg.escalationOffer && (
                        <div className="mt-1.5 flex max-w-[92%] flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                            <span>Σε βοήθησε αυτή η απάντηση;</span>
                            <button
                              type="button"
                              onClick={() =>
                                submitFeedback(msg.id, true, prevUser?.content)
                              }
                              className="rounded-md border border-charcoal/10 bg-white px-2 py-0.5 font-medium hover:border-gold/30"
                            >
                              Ναι
                            </button>
                            <button
                              type="button"
                              onClick={() => setFeedbackFollowUpId(msg.id)}
                              className="rounded-md border border-charcoal/10 bg-white px-2 py-0.5 font-medium hover:border-gold/30"
                            >
                              Όχι
                            </button>
                          </div>
                          {feedbackFollowUpId === msg.id && (
                            <div className="flex gap-2">
                              <input
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                placeholder="Τι δεν λύθηκε;"
                                className="min-h-8 flex-1 rounded-lg border border-charcoal/12 px-2.5 text-xs outline-none focus:border-gold/40"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  submitFeedback(
                                    msg.id,
                                    false,
                                    prevUser?.content,
                                    feedbackComment
                                  )
                                }
                                className="shrink-0 rounded-lg bg-charcoal px-2.5 text-xs font-medium text-white"
                              >
                                Αποστολή
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {loading && <AssistantTypingIndicator label={loadingPhrase} />}

                {error && (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-3 text-sm text-amber-950">
                    <p>{error}</p>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {lastFailedText && (
                        <button
                          type="button"
                          onClick={() => void sendText(lastFailedText)}
                          className="rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-medium text-charcoal hover:border-gold/40"
                        >
                          Δοκιμή ξανά
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEscalationOpen(true)}
                        className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-dark"
                      >
                        Επικοινωνία με υποστήριξη
                      </button>
                    </div>
                  </div>
                )}

                {ticketCreated && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900">
                    Αριθμός αιτήματος: <span className="font-semibold">{ticketCreated}</span>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-px shrink-0" />
              </div>

              {escalationOpen && (
                <form
                  onSubmit={submitSupport}
                  className="shrink-0 border-t border-charcoal/8 bg-sand/25 px-3.5 py-3 sm:px-4"
                >
                  <p className="mb-1 text-xs font-semibold text-charcoal">Αίτημα υποστήριξης</p>
                  <p className="mb-2 text-[11px] text-muted">
                    Περιέγραψε το πρόβλημα — η σελίδα και η αγγελία συμπληρώνονται αυτόματα.
                  </p>
                  <textarea
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                    placeholder="Τι προσπαθούσες να κάνεις; Τι δεν δούλεψε;"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-charcoal/12 bg-white px-3 py-2 text-sm outline-none focus:border-gold/40"
                    required
                    minLength={10}
                  />
                  <input
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="Email (αν δεν είσαι συνδεδεμένος)"
                    type="email"
                    className="mt-2 w-full rounded-xl border border-charcoal/12 bg-white px-3 py-2 text-sm outline-none focus:border-gold/40"
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={supportSending}
                      className="rounded-xl bg-gold px-3.5 py-2 text-xs font-semibold text-white hover:bg-gold-dark disabled:opacity-50"
                    >
                      {supportSending ? "Αποστολή…" : "Αποστολή στην υποστήριξη"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEscalationOpen(false)}
                      className="rounded-xl border border-charcoal/12 px-3.5 py-2 text-xs text-muted"
                    >
                      Ακύρωση
                    </button>
                  </div>
                </form>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendText(input);
                }}
                className="shrink-0 border-t border-charcoal/8 bg-white px-3.5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4"
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Γράψε την ερώτησή σου…"
                    rows={1}
                    className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-charcoal/12 bg-cream/35 px-3.5 py-2.5 text-sm text-charcoal outline-none focus:border-gold/45"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-white transition-colors hover:bg-gold-dark disabled:opacity-40"
                    aria-label="Αποστολή"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setEscalationOpen((v) => !v)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-gold-dark sm:hidden"
                >
                  <Headphones className="h-3.5 w-3.5" />
                  Υποστήριξη
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** Root mount: provider + floating widget (use in layout). */
export function AiAssistant() {
  return (
    <HelpAssistantProvider>
      <MidoraHelpWidget />
    </HelpAssistantProvider>
  );
}
