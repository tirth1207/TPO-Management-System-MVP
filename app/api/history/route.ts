import { NextResponse } from "next/server";
import { assertRole, jsonError, requireAuthedContext } from "@/lib/api";

export async function GET() {
  try {
    const ctx = await requireAuthedContext();
    assertRole(ctx, ["admin", "manager"]);

    const { data, error } = await ctx.supabase
      .from("history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return jsonError(400, "Failed to load history", error);

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg === "unauthorized") return jsonError(401, "Not signed in");
    if (msg === "forbidden") return jsonError(403, "Forbidden");
    return jsonError(500, "Unexpected error", msg);
  }
}
