/**
 * IMPORTANT:
 * This module is imported by BOTH server and client code (e.g. lib/supabase/client.ts).
 * Do NOT add `import "server-only"` here, otherwise Next will error when bundling client components
 * (and also when the project has any `pages/` routes).
 *
 * Only read NEXT_PUBLIC_* variables in this file.
 */

export type SupabasePublicEnv = {
  url: string | null;
  anonKey: string | null;
};

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    // Supabase is transitioning to "publishable key" naming
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    // Some templates/tutorials use this
    process.env.NEXT_PUBLIC_SUPABASE_KEY ??
    null;

  const url = urlRaw ? stripTrailingSlash(urlRaw) : null;

  return { url, anonKey };
}

export function assertSupabasePublicEnv(): { url: string; anonKey: string } {
  const { url, anonKey } = getSupabasePublicEnv();
  if (!url || !anonKey) {
    throw new Error(
      [
        "Supabase env vars missing.",
        "Set these env vars (locally in .env.local; on Vercel in Project Settings → Environment Variables):",
        "- NEXT_PUBLIC_SUPABASE_URL",
        "- NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
        "",
        "Note: after changing .env.local, you must restart the dev server.",
      ].join("\n")
    );
  }
  return { url, anonKey };
}
