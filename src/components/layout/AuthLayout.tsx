import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { MidoraLogo } from "@/components/brand/MidoraLogo";

export async function AuthLayout({
  children,
  variant = "centered",
}: {
  children: React.ReactNode;
  /** centered = classic auth card; marketing = full-page explainer + form */
  variant?: "centered" | "marketing";
}) {
  const t = await getTranslations("Auth");

  return (
    <div className="relative min-h-screen bg-cream">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_50%)]" />
      <header className="sticky top-0 z-50 border-b border-border/70 bg-cream/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4">
          <MidoraLogo href="/" variant="default" size="md" />
          <Link
            href="/"
            className="inline-flex min-h-10 items-center gap-2 text-sm text-charcoal/60 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("home")}
          </Link>
        </div>
      </header>
      {variant === "marketing" ? (
        <div className="relative">{children}</div>
      ) : (
        <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pb-12 pt-8">
          {children}
        </div>
      )}
    </div>
  );
}
