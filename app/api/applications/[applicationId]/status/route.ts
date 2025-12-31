import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, requireAuthedContext } from "@/lib/api";

const ParamsSchema = z.object({ applicationId: z.string().uuid() });
const BodySchema = z.object({
  status: z.enum([
    "applied",
    "shortlisted",
    "rejected",
    "interview_scheduled",
    "offer_made",
    "offer_accepted",
    "offer_rejected",
  ]),
});

export async function PATCH(req: Request, context: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireAuthedContext();
    const { applicationId } = ParamsSchema.parse(await context.params);
    const body = BodySchema.parse(await req.json());

    // Load application (RLS ensures you can only see what you’re allowed to act on)
    const { data: app, error: loadErr } = await ctx.supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (loadErr) return jsonError(400, "Failed to load application", loadErr);

    // Server-side role intent checks (DB triggers still enforce the state machine).
    if (ctx.role === "student") {
      if (app.student_user_id !== ctx.userId) return jsonError(403, "Forbidden");
      if (body.status !== "offer_accepted" && body.status !== "offer_rejected") {
        return jsonError(400, "Students can only accept/reject offers.");
      }
    } else if (ctx.role === "company") {
      // Ensure it belongs to company job (RLS join for update is not guaranteed, so we check explicitly)
      const { data: job, error: jobErr } = await ctx.supabase
        .from("jobs")
        .select("id, company_user_id")
        .eq("id", app.job_id)
        .single();

      if (jobErr) return jsonError(400, "Failed to validate job ownership", jobErr);
      if (job.company_user_id !== ctx.userId) return jsonError(403, "Forbidden");

      if (body.status === "offer_accepted" || body.status === "offer_rejected") {
        return jsonError(400, "Companies cannot accept/reject offers on behalf of students.");
      }
    } else if (ctx.role !== "admin" && ctx.role !== "manager") {
      return jsonError(403, "Forbidden");
    }

    const { error } = await ctx.supabase
      .from("applications")
      .update({ status: body.status })
      .eq("id", applicationId);

    if (error) return jsonError(400, "Failed to update application status", error);

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid request", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    return jsonError(500, "Unexpected error", msg);
  }
}
