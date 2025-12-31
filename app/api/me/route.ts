import { NextResponse } from "next/server";
import { jsonError, requireAuthedContext } from "@/lib/api";

export async function GET() {
  try {
    const ctx = await requireAuthedContext();

    const base = {
      user: {
        id: ctx.userId,
        email: ctx.email,
        emailVerified: ctx.emailVerified,
      },
      profile: ctx.profile,
    };

    if (ctx.role === "student") {
      const { data } = await ctx.supabase
        .from("student_profiles")
        .select("*")
        .eq("user_id", ctx.userId)
        .maybeSingle();
      return NextResponse.json({ ...base, studentProfile: data ?? null });
    }

    if (ctx.role === "faculty") {
      const { data } = await ctx.supabase
        .from("faculty_profiles")
        .select("*")
        .eq("user_id", ctx.userId)
        .maybeSingle();
      return NextResponse.json({ ...base, facultyProfile: data ?? null });
    }

    if (ctx.role === "company") {
      const { data } = await ctx.supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", ctx.userId)
        .maybeSingle();
      return NextResponse.json({ ...base, companyProfile: data ?? null });
    }

    return NextResponse.json(base);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    return jsonError(500, "Failed to load session", msg);
  }
}
