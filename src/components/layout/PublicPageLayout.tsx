import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type PublicPageLayoutProps = {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PublicPageLayout({
  children,
  className,
  narrow,
}: PublicPageLayoutProps) {
  return (
    <>
      <Navbar />
      <main
        className={cn(
          "min-h-screen overflow-x-hidden bg-cream pt-24 pb-16",
          className
        )}
      >
        <div
          className={cn(
            "mx-auto px-6",
            narrow ? "max-w-3xl" : "max-w-5xl"
          )}
        >
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

type StaticHeroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export function StaticHero({ eyebrow, title, subtitle, children }: StaticHeroProps) {
  return (
    <header className="border-b border-border pb-10 sm:pb-12">
      {eyebrow && (
        <p className="text-xs font-medium tracking-[0.2em] text-gold uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-charcoal sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
    </header>
  );
}

type StaticSectionProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function StaticSection({ title, children, className }: StaticSectionProps) {
  return (
    <section className={cn("py-10 sm:py-12", className)}>
      <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-charcoal/75 sm:text-base">
        {children}
      </div>
    </section>
  );
}

type StepItem = { title: string; description: string };

export function StepList({ steps }: { steps: StepItem[] }) {
  return (
    <ol className="mt-6 space-y-4">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex gap-4 rounded-2xl border border-border bg-white/80 p-5 shadow-soft"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-sm font-bold text-gold-dark">
            {index + 1}
          </span>
          <div>
            <h3 className="font-medium text-charcoal">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

type FaqItem = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-border bg-sand/40 px-5 py-4"
        >
          <summary className="cursor-pointer list-none font-medium text-charcoal marker:content-none [&::-webkit-details-marker]:hidden">
            {item.question}
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/70">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

type LegalSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold text-charcoal">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-charcoal/75">
        {children}
      </div>
    </section>
  );
}
