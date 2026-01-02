import { getSupabasePublicEnv } from "@/lib/supabase/env";

export default function SetupPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const error = typeof searchParams?.error === "string" ? searchParams?.error : null;
  const { url, anonKey } = getSupabasePublicEnv();

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-lg border border-black/10 bg-white p-6">
        <h1 className="text-lg font-semibold">Supabase is not configured</h1>

        {error && (
          <p className="mt-2 text-sm text-black/70">
            Error: <code className="font-mono">{error}</code>
          </p>
        )}

        <p className="mt-2 text-sm text-black/70">
          Set these environment variables (locally in <code className="font-mono">.env.local</code>; on Vercel in{" "}
          <span className="font-mono">Project Settings → Environment Variables</span>), then restart the dev server and
          refresh:
        </p>

        <pre className="mt-4 rounded-md bg-black/5 p-3 text-xs overflow-auto">{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
# (or) NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx`}</pre>

        <div className="mt-3 text-xs text-black/60">
          Detected in this environment:
          <ul className="mt-1 list-disc pl-5">
            <li>
              NEXT_PUBLIC_SUPABASE_URL: <span className="font-mono">{url ? "present" : "missing"}</span>
            </li>
            <li>
              NEXT_PUBLIC_SUPABASE_ANON_KEY / PUBLISHABLE_KEY:{" "}
              <span className="font-mono">{anonKey ? "present" : "missing"}</span>
            </li>
          </ul>
        </div>

        <p className="mt-3 text-sm text-black/70">
          If env vars are present but you still see errors, Supabase may be temporarily unreachable. Refresh and retry.
        </p>
      </div>
    </div>
  );
}
