import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { safePostAuthPath } from "@/lib/auth-redirect";
import CompleteProfileForm from "./CompleteProfileForm";

export default async function CompleteProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const params = await searchParams;
  const nextPath = safePostAuthPath(params.next ?? "/dashboard/listings");

  // Already has phone — do not trap the user on this page.
  if (profile.phone?.trim()) {
    redirect(nextPath);
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted">
          Φόρτωση...
        </div>
      }
    >
      <CompleteProfileForm
        defaultFullName={profile.full_name ?? ""}
        defaultPhone={profile.phone ?? ""}
        nextPath={nextPath}
      />
    </Suspense>
  );
}
