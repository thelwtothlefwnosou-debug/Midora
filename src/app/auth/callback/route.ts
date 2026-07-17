import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { promoteAdminFromEmail } from "@/lib/admin/auth";
import { resolveAuthProfileName } from "@/lib/auth-profile-name";
import { safePostAuthPath } from "@/lib/auth-redirect";
import { bootstrapAuthProfile } from "@/lib/profile-bootstrap";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePostAuthPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const cookieStore = await cookies();
  const pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] =
    [];

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
          pendingCookies.push({ name, value, options });
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  let redirectPath = next;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const meta = user.user_metadata ?? {};
    const fullName = resolveAuthProfileName({
      email: user.email,
      userMetadata: meta,
      identities: user.identities,
    });
    const phone = typeof meta.phone === "string" ? meta.phone : "";

    await bootstrapAuthProfile(supabase, {
      userId: user.id,
      fullName,
      phone,
      email: user.email ?? null,
      displayName: typeof meta.display_name === "string" ? meta.display_name : null,
      auth: {
        email: user.email,
        userMetadata: meta,
        identities: user.identities,
      },
    });

    await promoteAdminFromEmail(user.id, user.email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.phone?.trim()) {
      redirectPath = `/auth/complete-profile?next=${encodeURIComponent(next)}`;
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
