import { NextResponse } from "next/server";
import { z } from "zod";
import { assertRole, jsonError, requireAuthedContext } from "@/lib/api";

const QuerySchema = z.object({
  scope: z.enum(["college", "department", "company", "all"]).default("all"),
  department: z.string().trim().min(1).optional(),
  companyUserId: z.string().uuid().optional(),
});

const CreateSchema = z.object({
  academicYear: z.number().int().min(2000).max(2200),
  scopeType: z.enum(["college", "department", "company"]),
  department: z.string().trim().min(1).optional(),
  companyName: z.string().trim().min(1).optional(),
  companyUserId: z.string().uuid().optional(),
  totalStudents: z.number().int().min(0),
  eligibleStudents: z.number().int().min(0),
  placedStudents: z.number().int().min(0),
  companiesHiring: z.number().int().min(0),
  offers: z.number().int().min(0),
  avgCtc: z.number().min(0).nullable().optional(),
  medianCtc: z.number().min(0).nullable().optional(),
  highestCtc: z.number().min(0).nullable().optional(),
  lowestCtc: z.number().min(0).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.eligibleStudents > value.totalStudents) {
    ctx.addIssue({ code: "custom", path: ["eligibleStudents"], message: "Eligible students cannot exceed total students." });
  }
  if (value.placedStudents > value.eligibleStudents) {
    ctx.addIssue({ code: "custom", path: ["placedStudents"], message: "Placed students cannot exceed eligible students." });
  }
  if (value.offers < value.placedStudents) {
    ctx.addIssue({ code: "custom", path: ["offers"], message: "Offers cannot be lower than placed students." });
  }
  if (value.scopeType === "department" && !value.department) {
    ctx.addIssue({ code: "custom", path: ["department"], message: "Department is required." });
  }
  if (value.scopeType === "company" && !value.companyName) {
    ctx.addIssue({ code: "custom", path: ["companyName"], message: "Company name is required." });
  }
  if (value.scopeType !== "department" && value.department) {
    ctx.addIssue({ code: "custom", path: ["department"], message: "Department is only valid for department scope." });
  }
  if (value.scopeType === "college" && (value.companyName || value.companyUserId)) {
    ctx.addIssue({ code: "custom", path: ["scopeType"], message: "College records cannot have company details." });
  }
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["admin", "manager", "faculty", "company"]);

    const url = new URL(req.url);
    const parsed = QuerySchema.parse({
      scope: url.searchParams.get("scope") ?? "all",
      department: url.searchParams.get("department") ?? undefined,
      companyUserId: url.searchParams.get("companyUserId") ?? undefined,
    });

    let query = ctx.supabase
      .from("placement_comparison_records")
      .select("*")
      .order("academic_year", { ascending: false });

    if (ctx.role === "company") {
      query = query.eq("scope_type", "company").eq("company_user_id", ctx.userId);
    } else if (parsed.scope !== "all") {
      query = query.eq("scope_type", parsed.scope);
    }

    if (parsed.department) query = query.eq("department", parsed.department);
    if (parsed.companyUserId && ctx.role !== "company") {
      query = query.eq("company_user_id", parsed.companyUserId);
    }

    const { data, error } = await query.limit(500);
    if (error) return jsonError(400, "Failed to load placement comparison data", error);

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid filters", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["admin", "manager"]);

    const body = CreateSchema.parse(await req.json());

    const { data, error } = await ctx.supabase
      .from("placement_comparison_records")
      .upsert({
        academic_year: body.academicYear,
        scope_type: body.scopeType,
        department: body.scopeType === "department" ? body.department ?? null : null,
        company_name: body.scopeType === "company" ? body.companyName ?? null : null,
        company_user_id: body.scopeType === "company" ? body.companyUserId ?? null : null,
        total_students: body.totalStudents,
        eligible_students: body.eligibleStudents,
        placed_students: body.placedStudents,
        companies_hiring: body.companiesHiring,
        offers: body.offers,
        avg_ctc: body.avgCtc ?? null,
        median_ctc: body.medianCtc ?? null,
        highest_ctc: body.highestCtc ?? null,
        lowest_ctc: body.lowestCtc ?? null,
        notes: body.notes ?? null,
        created_by: ctx.userId,
      }, {
        onConflict: "academic_year,scope_type,department,company_user_id,company_name",
      })
      .select("*")
      .single();

    if (error) return jsonError(400, "Failed to save placement comparison record", error);

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) return jsonError(400, "Invalid record", e.flatten());
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}
