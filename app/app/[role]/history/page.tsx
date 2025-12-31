import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function HistoryPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  const ctx = await requireUser();

  if (!ctx.role) redirect("/onboarding");
  if (ctx.role !== role) redirect(`/app/${ctx.role}`);
  if (ctx.role !== "admin" && ctx.role !== "manager") redirect(`/app/${ctx.role}`);

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>History (Manager-audited)</CardTitle>
        <CardDescription className="mt-1">
          Only Manager actions are stored. Admin actions are intentionally not logged.
          Fetch data from <code className="font-mono">/api/history</code>.
        </CardDescription>
      </Card>
    </div>
  );
}
