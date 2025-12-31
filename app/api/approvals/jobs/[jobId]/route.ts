import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, jsonError, requireAuthedContext } from "@/lib/api";

const ParamsSchema = z.object({ jobId: z.string().uuid() });
const BodySchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().min(1).optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["admin", "manager"]);

    const { jobId } = ParamsSchema.parse(await context.params);
    const body = BodySchema.parse(await req.json());

    if (body.decision === "rejected" && !body.reason) {
      return jsonError(400, "Rejection reason is required.");
    }

    const payload =
      body.decision === "rejected"
        ? { approval_status: "rejected" as const, rejected_reason: body.reason }
        : { approval_status: "approved" as const, rejected_reason: null };

    const { error } = await ctx.supabase.from("jobs").update(payload).eq("id", jobId);

    if (error) return jsonError(400, "Failed to update job status", error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid request", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}
