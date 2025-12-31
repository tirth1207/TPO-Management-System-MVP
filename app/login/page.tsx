"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/auth";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ROLES: Role[] = ["student", "faculty", "company"];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("student");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.replace("/app");
        router.refresh();
        return;
      }

      // signup (student/faculty/company only)
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Ensure email confirmation returns users back into the app.
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role,
          },
        },
      });
      if (signUpError) throw signUpError;

      router.replace("/onboarding?step=verify-email");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        <CardDescription className="mt-1">
          Students, Faculty, and Companies can self-register. Managers are created by Admin.
        </CardDescription>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <div className="text-sm font-medium">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Password</div>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              minLength={8}
            />
          </div>

          {mode === "signup" && (
            <div className="space-y-1">
              <div className="text-sm font-medium">Role</div>
              <select
                className="h-10 w-full rounded-md border border-black/20 bg-white px-3 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <div className="text-xs text-black/60">
                Admin/Manager cannot be created here.
              </div>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button disabled={busy} className="w-full" type="submit">
            {busy ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </Button>

          <button
            type="button"
            className="w-full text-sm underline text-black/70"
            onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          >
            {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </form>
      </Card>
    </div>
  );
}
