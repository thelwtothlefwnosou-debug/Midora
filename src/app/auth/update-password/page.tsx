import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?error=config");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/forgot-password");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-24">
      <UpdatePasswordForm />
    </div>
  );
}
