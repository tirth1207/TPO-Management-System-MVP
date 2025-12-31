import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, jsonError, requireAuthedContext } from "@/lib/api";

const ParamsSchema = z.object({ jobId: z.string().uuid() });

/**
 * Jobs use the system-wide approval_status machine (draft->email_verified->pending_approval->approved/rejected).
 * For jobs, `email_verified` is treated as “submitted/ready”, then `pending_approval` enters the queue.
 */
export async function POST(_: Request, context: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["company"]);

    const { jobId } = ParamsSchema.parse(await context.params);

    const { data: job, error: jobErr } = await ctx.supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .eq("company_user_id", ctx.userId)
      .single();

    if (jobErr) return jsonError(400, "Failed to load job", jobErr);

    const next =
      job.approval_status === "draft"
        ? "email_verified"
        : job.approval_status === "email_verified"
          ? "pending_approval"
          : null;

    if (!next) {
      return jsonError(409, `Job cannot be submitted from state ${job.approval_status}.`);
    }

    const { error } = await ctx.supabase
      .from("jobs")
      .update({ approval_status: next })
      .eq("id", jobId)
      .eq("company_user_id", ctx.userId);

    if (error) return jsonError(400, "Failed to submit job", error);

    return NextResponse.json({ ok: true, approval_status: next });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid request", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}
