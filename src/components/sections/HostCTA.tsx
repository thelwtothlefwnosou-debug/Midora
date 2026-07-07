"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Home } from "lucide-react";
import {
  HOME_OWNER_RENTAL_CARDS,
  type OwnerRentalCard,
} from "@/lib/homepage-content";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import type { RentalType } from "@/lib/rental-types";
import { cn } from "@/lib/utils";

export function HostCTA() {
  const [selected, setSelected] = useState<RentalType>("short_term");

  const listingHref = `${OWNER_LISTING_NEW_PATH}?rentalType=${selected}`;

  return (
    <section className="home-section home-bg-sand border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="home-card relative overflow-hidden border-gold/15 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/[0.06] via-white to-sand/60"
            aria-hidden
          />
          <div className="relative w-full">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">
              Για αγγελιοδότες
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold text-charcoal sm:text-2xl">
              Ανέβασε την αγγελία σου στο Midora
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted/95">
              Δημοσίευσε ακίνητο για βραχυχρόνια ή μηνιαία/μεσοπρόθεσμη διαμονή και δέξου
              ενδιαφέροντα από επισκέπτες.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Τύπος αγγελίας">
              {HOME_OWNER_RENTAL_CARDS.map((card: OwnerRentalCard) => {
                const active = selected === card.rentalType;
                return (
                  <button
                    key={card.rentalType}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelected(card.rentalType)}
                    className={cn(
                      "flex h-full flex-col rounded-xl border bg-white p-4 text-left transition-all sm:p-5",
                      active
                        ? "border-gold bg-gold/[0.04] shadow-soft ring-1 ring-gold/25"
                        : "border-border hover:border-gold/30 hover:shadow-soft"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-sm font-semibold text-charcoal sm:text-base">
                        {card.title}
                      </h3>
                      {active && (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-muted sm:text-sm">
                      {card.text}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={listingHref} className="home-btn-primary">
                <Home className="h-4 w-4" />
                Ανέβασε αγγελία
              </Link>
              <Link href="/how-it-works" className="home-btn-secondary">
                Μάθε πώς λειτουργεί
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
