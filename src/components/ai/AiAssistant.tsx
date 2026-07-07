"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, Loader2, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

type MatchCard = {
  publicId: string;
  title: string;
  city: string;
  area: string;
  price: number;
};

export function AiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const listingId = pathname.match(/\/listings\/([^/]+)/)?.[1];
  const ownerListingId = pathname.match(/\/dashboard\/listings\/([^/]+)/)?.[1];
  const isHome = pathname === "/";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setMatches([]);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages,
          context: {
            page: pathname,
            listingId: listingId && listingId !== "new" ? listingId : undefined,
            ownerListingId:
              ownerListingId &&
              !["new", "edit", "photos", "pay"].includes(ownerListingId)
                ? ownerListingId
                : undefined,
          },
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        matches?: MatchCard[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Αποτυχία αιτήματος");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply?.trim() || "Δεν μπόρεσα να απαντήσω. Δοκίμασε ξανά.",
        },
      ]);
      if (data.matches?.length) setMatches(data.matches);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Σφάλμα σύνδεσης. Δοκίμασε ξανά.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-charcoal text-white shadow-[0_4px_20px_-4px_rgba(26,26,26,0.4)] transition-transform hover:scale-105 sm:bottom-6 sm:right-6 sm:h-auto sm:w-auto sm:gap-2 sm:rounded-full sm:px-4 sm:py-3",
            isHome ? "bottom-24" : "bottom-5"
          )}
          aria-label="AI βοηθός"
        >
          <MessageCircle className="h-5 w-5 text-gold-light sm:h-4 sm:w-4" />
          <span className="hidden text-sm font-medium sm:inline">Βοηθός</span>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          <button
            type="button"
            aria-label="Κλείσιμο"
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="relative flex h-[min(560px,78vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_80px_-20px_rgba(26,26,26,0.35)] sm:h-[min(640px,85vh)]"
          >
            <div className="flex items-center justify-between border-b border-border bg-sand/40 px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-charcoal">
                  <Sparkles className="h-4 w-4 text-gold" />
                  AI βοηθός ενοικίασης
                </h2>
                <p className="text-xs text-muted">
                  Ρώτα ό,τι θες — ενεργοποιείται μόνο από εσένα
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-sand hover:text-charcoal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.length === 0 && !loading && (
                <div className="rounded-xl border border-border bg-sand/30 p-4 text-sm text-muted">
                  Πες μας τι ψάχνεις και θα σε βοηθήσουμε να βρεις περιοχή ή τύπο
                  διαμονής.
                  <ul className="mt-2 list-inside list-disc space-y-1 text-charcoal/70">
                    <li>Θέλω σπίτι στην Αθήνα μέχρι 900€</li>
                    <li>Ποιο είναι το πιο φθηνό;</li>
                    <li>Με πάρκινγκ στη Θεσσαλονίκη</li>
                  </ul>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "ml-6 bg-gold/15 text-charcoal"
                      : "mr-6 border border-border bg-cream text-charcoal/90"
                  }`}
                >
                  {msg.content}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  Σκέφτομαι...
                </div>
              )}

              {matches.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium tracking-wider text-muted uppercase">
                    Σχετικά ακίνητα
                  </p>
                  {matches.map((m) => (
                    <Link
                      key={m.publicId}
                      href={`/listings/${m.publicId}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl border border-border bg-white p-3 text-sm transition-colors hover:border-gold/40 hover:bg-sand/30"
                    >
                      <p className="font-medium text-charcoal">{m.title}</p>
                      <p className="text-xs text-muted">
                        {m.area}, {m.city} · €{m.price}/μήνα
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="border-t border-border bg-white p-4">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Γράψε την ερώτησή σου..."
                  className="flex-1 rounded-xl border border-border bg-cream px-4 py-3 text-sm text-charcoal outline-none focus:border-gold/50"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="rounded-xl bg-gold px-4 py-3 text-white hover:bg-gold-dark disabled:opacity-40"
                  aria-label="Αποστολή"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
