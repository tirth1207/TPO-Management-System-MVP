import { redirect } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export default async function JobsPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const ctx = await requireUser();
  if (!ctx.role) redirect("/onboarding");
  if (ctx.role !== role) redirect(`/app/${ctx.role}`);
  if (ctx.role !== "company") redirect(`/app/${ctx.role}`);

  const blocked = ctx.approvalStatus !== "approved";

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Job postings</CardTitle>
        <CardDescription className="mt-1">
          Companies can post jobs only after approval.
        </CardDescription>
      </Card>

      <Card>
        <CardTitle>Create job</CardTitle>
        <CardDescription className="mt-1">
          UI scaffold only in this step.
        </CardDescription>

        <div className="mt-3">
          <Button disabled={blocked} title={blocked ? "Blocked until approved" : undefined}>
            New job (step 3)
          </Button>
        </div>

        {blocked && (
          <div className="mt-3 text-sm text-black/60">
            Blocked: company must be approved by Admin/Manager before posting jobs.
          </div>
        )}
      </Card>
    </div>
  );
}
