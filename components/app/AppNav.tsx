"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppNavProps = {
  role: string | null;
  email: string | null;
};

export function AppNav({ role, email }: AppNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const base = role ? `/app/${role}` : "/app";

  const links: Array<{ href: string; label: string; show: boolean }> = [
    { href: base, label: "Dashboard", show: true },
    { href: `${base}/approvals`, label: "Approvals", show: role === "faculty" || role === "manager" || role === "admin" },
    { href: `${base}/jobs`, label: "Jobs", show: role === "company" },
    { href: `${base}/applications`, label: "Applications", show: role === "student" },
    { href: `${base}/history`, label: "History", show: role === "manager" || role === "admin" },
  ].filter((l) => l.show);

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link href={base} className="font-semibold">
          TPO
        </Link>

        <nav className="flex items-center gap-2">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm hover:bg-black/5",
                  active && "bg-black/5"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-black/70">{email ?? ""}</div>
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
