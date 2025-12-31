import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, jsonError, requireAuthedContext } from "@/lib/api";

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1).nullable().optional(),
  ctc: z.number().nonnegative().nullable().optional(),
});

export async function GET() {
  try {
    const ctx = await requireAuthedContext();

    // Return least-privilege set per role (don’t rely only on RLS for UX).
    let q = ctx.supabase.from("jobs").select("*").order("created_at", { ascending: false });

    if (ctx.role === "student" || ctx.role === "faculty") {
      q = q.eq("approval_status", "approved");
    } else if (ctx.role === "company") {
      q = q.eq("company_user_id", ctx.userId);
    }

    const { data, error } = await q;
    if (error) return jsonError(400, "Failed to load jobs", error);

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    return jsonError(500, "Unexpected error", msg);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["company"]);

    if (ctx.profile.approval_status !== "approved") {
      return jsonError(403, "Company must be approved before creating jobs.");
    }

    const body = CreateSchema.parse(await req.json());

    const { data, error } = await ctx.supabase
      .from("jobs")
      .insert({
        company_user_id: ctx.userId,
        title: body.title,
        description: body.description,
        location: body.location ?? null,
        ctc: body.ctc ?? null,
        approval_status: "draft",
        state: "open",
      })
      .select("*")
      .single();

    if (error) return jsonError(400, "Failed to create job", error);
    return NextResponse.json({ item: data }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid request", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}
