import { NextResponse } from "next/server";
import { assertRole, jsonError, requireAuthedContext } from "@/lib/api";

export async function GET() {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["admin", "manager"]);

    const { data, error } = await ctx.supabase
      .from("jobs")
      .select("*")
      .eq("approval_status", "pending_approval")
      .order("created_at", { ascending: false });

    if (error) return jsonError(400, "Failed to load job approvals", error);
    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}
