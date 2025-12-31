import { requireUser, requireEmailVerified, requireProfileCompletionIfNeeded } from "@/lib/auth";
import { AppNav } from "@/components/app/AppNav";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireUser();

  // Enforce base gates early (email verification + mandatory profile completion where required)
  requireEmailVerified(ctx);
  requireProfileCompletionIfNeeded(ctx);

  return (
    <div className="min-h-screen p-6">
      <AppNav role={ctx.role} email={ctx.email} />

      {/* Global gating banner for unapproved users */}
      {ctx.role !== "admin" && ctx.role !== "manager" && ctx.approvalStatus !== "approved" && (
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Access restricted</CardTitle>
              <CardDescription className="mt-1">
                Your account is not approved yet. You can sign in, but operational actions are blocked.
              </CardDescription>
            </div>
            <Badge>{ctx.approvalStatus}</Badge>
          </div>
        </Card>
      )}

      {children}
    </div>
  );
}
