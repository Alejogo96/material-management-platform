import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { NoDatabase } from "@/components/no-database";

export const dynamic = "force-dynamic";

export default async function BodegaLayout({ children }: { children: React.ReactNode }) {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  return (
    <AppShell user={user} active="inbox">
      {children}
    </AppShell>
  );
}
