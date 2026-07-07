import { HOME_TRUST_STRIP } from "@/lib/homepage-content";

export function TrustStrip() {
  return (
    <section
      aria-label="Γιατί να εμπιστευτείς το Midora"
      className="home-bg-white border-y border-border"
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOME_TRUST_STRIP.map((item) => (
            <li
              key={item.title}
              className="home-card flex h-full flex-col gap-2.5 px-4 py-4"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-sand/45">
                <item.icon
                  className="h-4 w-4 text-gold"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-charcoal">
                  {item.title}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted/95">
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
