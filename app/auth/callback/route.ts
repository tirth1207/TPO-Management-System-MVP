import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase email confirmation / magic link callback.
 * Exchanges the code for a session cookie, then redirects into the app.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const supabase = await createClient();

  if (code) {
    // If exchange fails, we still redirect; user can retry sign-in.
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/app", url.origin));
}
