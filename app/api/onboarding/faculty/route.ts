import { NextResponse } from "next/server";
import { z } from "zod";
import { assertEmailVerified, assertRole, jsonError, requireAuthedContext } from "@/lib/api";

const BodySchema = z.object({
  fullName: z.string().min(1),
  department: z.string().min(1),
  phone: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["faculty"]);
    assertEmailVerified(ctx);

    if (ctx.profile.approval_status !== "email_verified") {
      return jsonError(409, "Faculty must be in email_verified state before requesting approval.");
    }

    const body = BodySchema.parse(await req.json());

    const upsertRes = await ctx.supabase.from("faculty_profiles").upsert(
      {
        user_id: ctx.userId,
        full_name: body.fullName,
        department: body.department,
        phone: body.phone,
      },
      { onConflict: "user_id" }
    );

    if (upsertRes.error) return jsonError(400, "Failed to save faculty profile", upsertRes.error);

    const updateRes = await ctx.supabase
      .from("profiles")
      .update({ profile_complete: true, approval_status: "pending_approval" })
      .eq("user_id", ctx.userId);

    if (updateRes.error) return jsonError(400, "Failed to request approval", updateRes.error);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid request", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    if (msg === "email_not_verified") return jsonError(409, "Email not verified");
    return jsonError(500, "Unexpected error", msg);
  }
}
