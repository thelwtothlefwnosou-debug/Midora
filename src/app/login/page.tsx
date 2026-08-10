import { AuthMarketingPage } from "@/components/auth/AuthMarketingPage";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : "login";
  const redirectTo = params.redirect ?? params.next ?? "/";

  return (
    <AuthLayout variant="marketing">
      <AuthMarketingPage
        initialMode={mode}
        redirectTo={redirectTo}
        errorCode={params.error ?? null}
        referralCode={params.ref ?? null}
      />
    </AuthLayout>
  );
}
