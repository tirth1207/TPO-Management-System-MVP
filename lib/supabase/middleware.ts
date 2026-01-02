import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  // If Supabase env vars are not configured, don't crash the entire app in middleware.
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabasePublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  // Avoid hammering Supabase on every request when no auth cookies exist
  // (and reduce ECONNRESET spam if Supabase/network is unstable).
  const hasSupabaseAuthCookie = request.cookies
    .getAll()
    .some(
      (c) => c.name.startsWith("sb-") || c.name === "sb-access-token" || c.name === "sb-refresh-token"
    );

  // Also skip session refresh on public/auth pages.
  const path = request.nextUrl.pathname;
  const isPublicPath = path.startsWith("/login") || path.startsWith("/onboarding") || path.startsWith("/setup");

  if (!hasSupabaseAuthCookie || isPublicPath) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    return supabaseResponse;
  }

  return supabaseResponse;
}
