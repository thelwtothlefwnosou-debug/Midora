import { AuthPanel } from "@/components/auth/AuthPanel";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const mode = params.mode === "register" ? "register" : "login";
  const redirectTo = params.redirect ?? params.next ?? "/dashboard";

  return (
    <AuthLayout>
      <AuthPanel
        initialMode={mode}
        redirectTo={redirectTo}
        errorCode={params.error ?? null}
        referralCode={params.ref ?? null}
      />
    </AuthLayout>
  );
}
