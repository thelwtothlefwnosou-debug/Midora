import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { safePostAuthPath } from "@/lib/auth-redirect";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const authPaths = ["/login", "/register", "/auth/"];
  const isAuthPath = authPaths.some((p) => path.startsWith(p));

  const authExempt = [
    "/auth/complete-profile",
    "/auth/forgot-password",
    "/auth/update-password",
  ];
  const isAuthExempt = authExempt.some((p) => path.startsWith(p));

  if (user && isAuthPath && !isAuthExempt) {
    const url = request.nextUrl.clone();
    const redirectTarget = safePostAuthPath(
      request.nextUrl.searchParams.get("redirect") ??
        request.nextUrl.searchParams.get("next")
    );
    url.pathname = redirectTarget;
    url.search = "";
    return NextResponse.redirect(url);
  }

  const protectedPaths = ["/dashboard", "/admin"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (user && isProtected && !path.startsWith("/auth/complete-profile")) {
    const skipPhoneGate =
      path.startsWith("/admin/forbidden");
    if (!skipPhoneGate) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();

      if (!profile?.phone?.trim()) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/complete-profile";
        url.searchParams.set("next", path);
        return NextResponse.redirect(url);
      }
    }
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && user && !path.startsWith("/admin/forbidden")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/forbidden";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
