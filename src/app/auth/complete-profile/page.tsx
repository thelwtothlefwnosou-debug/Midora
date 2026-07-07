import { Suspense } from "react";
import { getCurrentProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CompleteProfileForm from "./CompleteProfileForm";

export default async function CompleteProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

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
      />
    </Suspense>
  );
}
