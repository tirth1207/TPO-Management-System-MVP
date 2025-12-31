import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import type { Role } from "@/lib/auth";

export type ProfileRow = Tables<"profiles">;

export type AuthedContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  email: string | null;
  emailVerified: boolean;
  profile: ProfileRow;
  role: Role;
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

export function jsonError(
  status: number,
  message: string,
  details?: unknown
): NextResponse {
  return NextResponse.json({ error: { message, details } }, { status });
}

export async function requireAuthedContext(): Promise<AuthedContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }
  if (!user) {
    throw new Error("unauthorized");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!isRole(profile.role)) {
    throw new Error("invalid_role");
  }

  return {
    supabase,
    userId: user.id,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    profile,
    role: profile.role,
  };
}

export function assertRole(ctx: AuthedContext, allowed: Role[]) {
  if (!allowed.includes(ctx.role)) {
    throw new Error("forbidden");
  }
}

export function assertEmailVerified(ctx: AuthedContext) {
  if (!ctx.emailVerified) {
    throw new Error("email_not_verified");
  }
}
