import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import {
  requireRole,
  requireUser,
  type Role,
} from "@/lib/auth";

export default async function RoleDashboardPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role: roleParam } = await params;
  const ctx = await requireUser();

  if (!ctx.role) redirect("/onboarding");

  // Ensure URL role matches authenticated role
  requireRole(ctx, [roleParam as Role]);

  const blocked =
    ctx.role !== "admin" &&
    ctx.role !== "manager" &&
    ctx.approvalStatus !== "approved";

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Dashboard: {ctx.role}</CardTitle>
            <CardDescription className="mt-1">
              Approval-driven access. No state skipping. No client-trusted privilege.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge>email: {ctx.emailVerified ? "verified" : "unverified"}</Badge>
            <Badge>status: {ctx.approvalStatus}</Badge>
          </div>
        </div>
      </Card>

      {ctx.role === "student" && (
        <Card>
          <CardTitle>Student actions</CardTitle>
          <CardDescription className="mt-1">
            You can browse and apply only after approval.
          </CardDescription>
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline">
              <Link href="/app/student/applications">Applications</Link>
            </Button>
            <Button disabled={blocked} title={blocked ? "Blocked until approved" : undefined}>
              Browse jobs (step 3)
            </Button>
          </div>
        </Card>
      )}

      {ctx.role === "faculty" && (
        <Card>
          <CardTitle>Faculty actions</CardTitle>
          <CardDescription className="mt-1">
            You can approve/reject students only after your own approval by Admin/Manager.
          </CardDescription>
          <div className="mt-3 flex gap-2">
            <Button
              asChild
              variant="outline"
              aria-disabled={blocked}
              title={blocked ? "Blocked until approved" : undefined}
            >
              <Link href="/app/faculty/approvals">Student approval queue</Link>
            </Button>
          </div>
        </Card>
      )}

      {ctx.role === "company" && (
        <Card>
          <CardTitle>Company actions</CardTitle>
          <CardDescription className="mt-1">
            You can post jobs only after Admin/Manager approval.
          </CardDescription>
          <div className="mt-3 flex gap-2">
            <Button
              asChild
              variant="outline"
              aria-disabled={blocked}
              title={blocked ? "Blocked until approved" : undefined}
            >
              <Link href="/app/company/jobs">Job postings</Link>
            </Button>
          </div>
        </Card>
      )}

      {(ctx.role === "manager" || ctx.role === "admin") && (
        <Card>
          <CardTitle>{ctx.role} actions</CardTitle>
          <CardDescription className="mt-1">
            Admin and Manager have identical powers. Manager actions are logged; Admin actions are not.
          </CardDescription>
          <div className="mt-3 flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/app/${ctx.role}/approvals`}>Approval queues</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
