import Link from "next/link";
import { db } from "@/db";
import { requireAdminPage } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { listVans } from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { NoDatabase } from "@/components/no-database";
import { NotAdmin } from "../../not-admin";
import { UserForm } from "../../user-form";

export const dynamic = "force-dynamic";

export default async function NuevoUsuario() {
  if (!db) return <NoDatabase />;
  const user = await requireAdminPage();
  if (!user.isAdmin) return <NotAdmin user={user} />;
  const t = tr(user.locale);
  const teams = await listVans(user.companyId);
  return (
    <AppShell user={user} active="users">
      <Link href="/admin/usuarios" className="text-sm font-semibold text-andy-red">← {t("People & teams", "Personas y equipos")}</Link>
      <h1 className="mt-1 mb-6 text-3xl font-bold">{t("New profile", "Nuevo perfil")}</h1>
      <UserForm locale={user.locale} teams={teams} />
    </AppShell>
  );
}
