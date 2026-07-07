import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { promoteAdminFromEmail } from "@/lib/admin/auth";
import { safePostAuthPath } from "@/lib/auth-redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePostAuthPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const meta = user.user_metadata ?? {};
    const fullName =
      meta.full_name ?? meta.name ?? user.email?.split("@")[0] ?? "Χρήστης";
    const phone = meta.phone ?? "";

    const db = createServiceClient() ?? supabase;
    await db.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        phone,
        email: user.email ?? null,
      },
      { onConflict: "id" }
    );

    await promoteAdminFromEmail(user.id, user.email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .single();

    if (!profile?.phone?.trim()) {
      return NextResponse.redirect(
        `${origin}/auth/complete-profile?next=${encodeURIComponent(next)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
