import { HOME_WHY_MIDORA } from "@/lib/homepage-content";
import { HomeIconBadge, HomeSectionHeader } from "@/components/sections/HomeSectionHeader";

export function WhyMidora() {
  return (
    <section className="home-section home-bg-cream border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <HomeSectionHeader
          title="Γιατί Midora"
          subtitle="Αγγελίες για λίγες ημέρες ή για 2+ μήνες — με σαφήνεια και απευθείας επικοινωνία."
        />

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {HOME_WHY_MIDORA.map((card) => (
            <article key={card.title} className="home-card home-card-lift p-5 sm:p-6">
              <HomeIconBadge icon={card.icon} />
              <h3 className="mt-4 font-display text-lg font-semibold text-charcoal">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted/95">{card.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
