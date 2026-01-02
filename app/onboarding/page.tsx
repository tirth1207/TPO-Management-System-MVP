"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Role } from "@/lib/auth";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ApiErrorShape = {
  error?: {
    message?: string;
    details?: unknown;
  };
};

function isApiErrorShape(value: unknown): value is ApiErrorShape {
  return typeof value === "object" && value !== null && "error" in value;
}

function extractApiErrorMessage(value: unknown): string | null {
  if (!isApiErrorShape(value)) return null;
  const msg = value.error?.message;
  return typeof msg === "string" && msg.length > 0 ? msg : null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const step = params.get("step") ?? "profile";

  const [role, setRole] = React.useState<Role | null>(null);
  const [emailVerified, setEmailVerified] = React.useState<boolean>(false);

  const [fullName, setFullName] = React.useState("");
  const [orgName, setOrgName] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (!u) {
        router.replace("/login");
        router.refresh();
        return;
      }
      if (cancelled) return;

      const meta = u.user_metadata ?? {};
      setRole((meta["role"] as Role) ?? null);
      setEmailVerified(Boolean(u.email_confirmed_at));
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fullNameTrimmed = fullName.trim();
  const orgNameTrimmed = orgName.trim();

  const canSubmit =
    !busy &&
    emailVerified &&
    step !== "verify-email" &&
    role !== null &&
    ((role === "student" && fullNameTrimmed.length > 0) ||
      (role === "company" && orgNameTrimmed.length > 0) ||
      role === "faculty");

  async function markProfileComplete() {
    setError(null);

    if (!role) {
      setError("Role is not set for your account. Contact Admin.");
      return;
    }
    if (!emailVerified) {
      setError("Please verify your email first.");
      return;
    }
    if (role === "student" && fullNameTrimmed.length === 0) {
      setError("Full name is required.");
      return;
    }
    if (role === "company" && orgNameTrimmed.length === 0) {
      setError("Company legal name is required.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/onboarding/${role}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          role === "student"
            ? {
                fullName: fullNameTrimmed,
                department: "TBD",
                graduationYear: new Date().getFullYear(),
                phone: "TBD",
              }
            : role === "company"
              ? {
                  companyName: orgNameTrimmed,
                  contactName: fullNameTrimmed || "TBD",
                  contactEmail: "tbd@example.com",
                  contactPhone: "TBD",
                  website: null,
                }
              : role === "faculty"
                ? {
                    fullName: fullNameTrimmed || "TBD",
                    department: "TBD",
                    phone: "TBD",
                  }
                : {}
        ),
      });

      // Parse response robustly (API might return non-JSON on unexpected crashes)
      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = text ? (JSON.parse(text) as unknown) : null;
      } catch {
        parsed = null;
      }

      if (!res.ok) {
        const msg = extractApiErrorMessage(parsed) ?? `Request failed (${res.status})`;
        // Helpful for debugging during dev (will show details in console)
        // eslint-disable-next-line no-console
        console.error("Onboarding API error:", { status: res.status, body: parsed ?? text });
        throw new Error(msg);
      }

      router.replace("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardTitle>Onboarding</CardTitle>
        <CardDescription className="mt-1">
          Email verification and mandatory profile completion are enforced before approvals.
        </CardDescription>

        <div className="mt-4 space-y-4">
          {!emailVerified || step === "verify-email" ? (
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Verify your email</div>
                <div className="text-black/70">
                  Check your inbox and verify your email address. Then come back and click refresh.
                </div>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  // refresh auth session + UI state
                  const supabase = createClient();
                  await supabase.auth.refreshSession();
                  router.refresh();
                }}
              >
                Refresh status
              </Button>
            </div>
          ) : role === "student" ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Student Profile</div>
              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Button disabled={!canSubmit} onClick={markProfileComplete}>
                {busy ? "Saving..." : "Submit profile for Faculty approval"}
              </Button>
            </div>
          ) : role === "company" ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Company Profile</div>
              <Input
                placeholder="Company legal name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
              <Input
                placeholder="Contact name (optional)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Button disabled={!canSubmit} onClick={markProfileComplete}>
                {busy ? "Saving..." : "Submit profile for Admin/Manager approval"}
              </Button>
            </div>
          ) : role === "faculty" ? (
            <div className="space-y-3">
              <div className="text-sm">
                Faculty accounts require Admin/Manager approval before you can approve students.
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  router.replace("/app");
                  router.refresh();
                }}
              >
                Go to dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="font-medium">Role not set</div>
              <div className="text-black/70">
                Your account is missing a role. Contact Admin.
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  router.replace("/login");
                  router.refresh();
                }}
              >
                Back to login
              </Button>
            </div>
          )}

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </Card>
    </div>
  );
}
