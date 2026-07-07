import { HOME_HOW_IT_WORKS } from "@/lib/homepage-content";
import { HomeIconBadge, HomeSectionHeader } from "@/components/sections/HomeSectionHeader";
import { MessageSquare, Phone } from "lucide-react";

const CONTACT_METHODS = ["Τηλέφωνο", "WhatsApp", "Viber", "Μήνυμα"] as const;

export function HowItWorks() {
  return (
    <section id="how" className="home-section home-bg-white border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title="Πώς λειτουργεί"
          subtitle="Τέσσερα απλά βήματα — από την αναζήτηση μέχρι την επικοινωνία."
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {HOME_HOW_IT_WORKS.map((step, i) => (
            <article
              key={step.title}
              className="home-card home-card-muted relative p-5 sm:p-6"
            >
              <span className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-charcoal/90 text-[11px] font-bold text-white">
                {i + 1}
              </span>
              <HomeIconBadge icon={step.icon} />
              <h3 className="mt-4 font-display text-base font-semibold text-charcoal sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted/95">{step.text}</p>
              {i === 3 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {CONTACT_METHODS.map((method, idx) => (
                    <span
                      key={method}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-medium text-charcoal/80"
                    >
                      {idx === 0 ? (
                        <Phone className="h-3.5 w-3.5 text-gold" />
                      ) : idx === 3 ? (
                        <MessageSquare className="h-3.5 w-3.5 text-gold/80" />
                      ) : null}
                      {method}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
