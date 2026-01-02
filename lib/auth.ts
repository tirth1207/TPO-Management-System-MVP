import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export type Role = "student" | "faculty" | "company" | "manager" | "admin";
export type ApprovalStatus = "draft" | "email_verified" | "pending_approval" | "approved" | "rejected";

export type UserContext = {
  userId: string;
  email: string | null;
  role: Role | null;
  emailVerified: boolean;
  profileComplete: boolean;
  approvalStatus: ApprovalStatus;
};

function isRole(value: unknown): value is Role {
  return (
    value === "student" ||
    value === "faculty" ||
    value === "company" ||
    value === "manager" ||
    value === "admin"
  );
}

export async function requireUser(): Promise<UserContext> {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabasePublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    redirect("/setup?error=missing_env");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const emailVerified = Boolean(user.email_confirmed_at);

    const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();

    if (!profile) {
      // If profile trigger hasn't populated for some reason, force setup flow.
      redirect("/setup?error=missing_profile");
    }

    const role = profile.role as Role;
    const profileComplete = profile.profile_complete;
    const approvalStatus = profile.approval_status as ApprovalStatus;

    return {
      userId: user.id,
      email: user.email ?? null,
      role,
      emailVerified,
      profileComplete,
      approvalStatus,
    };
  } catch {
    redirect("/setup?error=supabase_unreachable");
  }
}

export function requireRole(ctx: UserContext, allowed: Role[]) {
  if (!ctx.role || !allowed.includes(ctx.role)) redirect("/app");
}

export function requireEmailVerified(ctx: UserContext) {
  if (!ctx.emailVerified) redirect("/onboarding?step=verify-email");
}

export function requireProfileCompletionIfNeeded(ctx: UserContext) {
  if ((ctx.role === "student" || ctx.role === "company") && !ctx.profileComplete) {
    redirect("/onboarding?step=profile");
  }
}
