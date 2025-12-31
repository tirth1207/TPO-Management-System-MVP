export default function SetupPage() {
  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="w-full max-w-xl rounded-lg border border-black/10 bg-white p-6">
        <h1 className="text-lg font-semibold">Supabase is not configured</h1>
        <p className="mt-2 text-sm text-black/70">
          Set these environment variables in <code className="font-mono">.env.local</code>, then refresh:
        </p>

        <pre className="mt-4 rounded-md bg-black/5 p-3 text-xs overflow-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx`}
        </pre>

        <p className="mt-3 text-sm text-black/70">
          If env vars are set but you still see errors, Supabase may be temporarily unreachable.
          Refresh and retry.
        </p>
      </div>
    </div>
  );
}
