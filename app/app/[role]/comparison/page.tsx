import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { ComparisonDashboard, type ComparisonRecord } from "@/components/comparison/ComparisonDashboard";

export default async function PlacementComparisonPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const ctx = await requireUser();

  if (!ctx.role) redirect("/onboarding");
  if (ctx.role !== role) redirect(`/app/${ctx.role}`);
  if (!["admin", "manager", "faculty", "company"].includes(ctx.role)) {
    redirect(`/app/${ctx.role}`);
  }

  const supabase = await createClient();
  let query = supabase
    .from("placement_comparison_records")
    .select("*")
    .order("academic_year", { ascending: false })
    .limit(500);

  if (ctx.role === "company") {
    query = query.eq("scope_type", "company").eq("company_user_id", ctx.userId);
  }

  const { data, error } = await query;
  const { data: companies } =
    ctx.role === "admin" || ctx.role === "manager"
      ? await supabase
          .from("company_profiles")
          .select("user_id, company_name")
          .order("company_name", { ascending: true })
      : { data: [] };

  if (error) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h2 className="font-semibold">Placement comparison</h2>
        <p className="mt-2 text-sm text-black/60">
          The comparison dataset is not available yet. Apply the placement comparison migration, then refresh this page.
        </p>
      </div>
    );
  }

  return (
    <ComparisonDashboard
      role={ctx.role}
      initialRecords={(data ?? []) as ComparisonRecord[]}
      companies={(companies ?? []) as { user_id: string; company_name: string }[]}
    />
  );
}
