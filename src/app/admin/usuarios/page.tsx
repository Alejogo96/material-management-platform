import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireAdminPage } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { AppShell } from "@/components/app-shell";
import { Badge, btn } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";
import { NotAdmin } from "../not-admin";

export const dynamic = "force-dynamic";

export default async function Usuarios() {
  if (!db) return <NoDatabase />;
  const user = await requireAdminPage();
  const t = tr(user.locale);
  if (!user.isAdmin) return <NotAdmin user={user} />;
  const [people, roles, teams] = await Promise.all([
    db.select().from(s.users).where(eq(s.users.companyId, user.companyId)).orderBy(asc(s.users.fullName)),
    db.select().from(s.userRoles),
    db.select().from(s.locations).where(eq(s.locations.companyId, user.companyId)),
  ]);
  const roleName: Record<string, string> = {
    owner: t("Owner", "Dueño"),
    manager: "Manager",
    van_leader: t("Van leader", "Líder de van"),
    warehouse: t("Warehouse", "Bodega"),
    purchasing: t("Purchasing", "Compras"),
  };
  const teamName = new Map(teams.map((x) => [x.id, x.name]));

  return (
    <AppShell user={user} active="users">
      <header className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink-muted">{people.length} {t("people", "personas")}</p>
          <h1 className="text-3xl font-bold">{t("People & teams", "Personas y equipos")}</h1>
        </div>
        <Link href="/admin/usuarios/nuevo" className={`${btn.accent} w-full sm:w-auto`}>+ {t("New profile", "Nuevo perfil")}</Link>
      </header>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-subtle text-left text-[11px] tracking-wide text-ink-muted uppercase">
            <tr>
              <th className="px-4 py-2.5 font-semibold">{t("Name", "Nombre")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("Email", "Correo")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("Role", "Rol")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("Team", "Equipo")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("Access", "Acceso")}</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t border-border hover:bg-page">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/admin/usuarios/${p.id}`} className="text-andy-red hover:underline">{p.fullName}</Link>
                </td>
                <td className="px-4 py-3 text-ink-muted">{p.email ?? "—"}</td>
                <td className="px-4 py-3">{roles.filter((r) => r.userId === p.id).map((r) => roleName[r.role]).join(" · ")}</td>
                <td className="px-4 py-3">{p.teamId ? teamName.get(p.teamId) ?? "—" : "—"}</td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {p.isAdmin && <Badge tone="brand">Admin</Badge>}
                    {!p.active && <Badge>{t("Inactive", "Inactivo")}</Badge>}
                    {p.passwordHash ? <Badge tone="success">{t("Password", "Contraseña")}</Badge> : <Badge>{t("Demo only", "Solo demo")}</Badge>}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
