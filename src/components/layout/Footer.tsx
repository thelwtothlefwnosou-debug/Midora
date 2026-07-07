import Link from "next/link";
import { OWNER_LISTING_NEW_PATH } from "@/lib/owner-flow";
import { PORTAL_LEGAL_BLOCKS } from "@/lib/rental-types";
import { FooterBugReport } from "@/components/feedback/FooterBugReport";
import { MidoraLogo } from "@/components/brand/MidoraLogo";

const supportEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@midora.gr";

const footerLinks = {
  Midora: [
    { label: "Σχετικά με εμάς", href: "/about" },
    { label: "Πώς λειτουργεί", href: "/how-it-works" },
    { label: "Επικοινωνία", href: "/contact" },
  ],
  Πλατφόρμα: [
    { label: "Αναζήτηση", href: "/listings" },
    { label: "Αγαπημένα", href: "/dashboard/favorites" },
    { label: "Αναφορά προβλήματος", href: "/help#report" },
  ],
  Αγγελιοδότες: [
    { label: "Για αγγελιοδότες", href: "/owners" },
    { label: "Δημοσίευση αγγελίας", href: OWNER_LISTING_NEW_PATH },
  ],
  Νομικά: [
    { label: "Όροι χρήσης", href: "/terms" },
    { label: "Πολιτική απορρήτου", href: "/privacy" },
    { label: "Κανόνες αγγελιών", href: "/listing-rules" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-sand/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-12">
          <div className="lg:col-span-2">
            <MidoraLogo href="/" variant="default" size="md" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted/95">
              {PORTAL_LEGAL_BLOCKS[0]}
            </p>
            <Link
              href="/contact"
              className="mt-5 inline-flex text-sm text-muted transition-colors hover:text-gold-dark"
            >
              Επικοινωνία
            </Link>
            <a
              href={`mailto:${supportEmail}`}
              className="mt-2 block text-sm text-muted transition-colors hover:text-gold-dark"
            >
              {supportEmail}
            </a>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-charcoal">{title}</h4>
              <ul className="mt-3.5 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-gold-dark"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-2 border-t border-border pt-6 sm:pt-8">
          {PORTAL_LEGAL_BLOCKS.slice(1).map((block) => (
            <p key={block.slice(0, 28)} className="max-w-3xl text-xs leading-relaxed text-muted/75">
              {block}
            </p>
          ))}
          <p className="text-xs text-muted/90">
            © {new Date().getFullYear()} Midora. Με επιφύλαξη παντός δικαιώματος.
          </p>
          <FooterBugReport />
        </div>
      </div>
    </footer>
  );
}
