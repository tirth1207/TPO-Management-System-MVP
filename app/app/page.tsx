import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function AppIndexPage() {
  const ctx = await requireUser();

  if (!ctx.role) redirect("/onboarding");

  redirect(`/app/${ctx.role}`);
}
