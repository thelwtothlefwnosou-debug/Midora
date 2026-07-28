import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { MidoraLogo } from "@/components/brand/MidoraLogo";

export async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("Auth");

  return (
    <div className="relative min-h-screen bg-cream">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.08),transparent_50%)]" />
      <header className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <MidoraLogo href="/" variant="default" size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("home")}
          </Link>
        </div>
      </header>
      <div className="relative flex min-h-screen items-center justify-center px-4 pb-12 pt-28">
        {children}
      </div>
    </div>
  );
}
