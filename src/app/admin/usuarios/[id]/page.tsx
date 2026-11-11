import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireAdminPage } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { listVans } from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { NoDatabase } from "@/components/no-database";
import { NotAdmin } from "../../not-admin";
import { ResetPasswordForm, UserForm } from "../../user-form";

export const dynamic = "force-dynamic";

export default async function EditarUsuario({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ creado?: string }> }) {
  if (!db) return <NoDatabase />;
  const user = await requireAdminPage();
  if (!user.isAdmin) return <NotAdmin user={user} />;
  const { id } = await params;
  const { creado } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [p] = await db.select().from(s.users).where(and(eq(s.users.id, id), eq(s.users.companyId, user.companyId)));
  if (!p) notFound();
  const [roles, teams] = await Promise.all([db.select().from(s.userRoles).where(eq(s.userRoles.userId, id)), listVans(user.companyId)]);
  const t = tr(user.locale);
  return (
    <AppShell user={user} active="users">
      <Link href="/admin/usuarios" className="text-sm font-semibold text-andy-red">← {t("People & teams", "Personas y equipos")}</Link>
      <h1 className="mt-1 mb-4 text-3xl font-bold">{p.fullName}</h1>
      {creado && <p role="status" className="mb-4 max-w-xl rounded-md bg-success-bg px-3 py-2 text-sm text-success">{t("Profile created. They can sign in with their email and password.", "Perfil creado. Ya puede entrar con su correo y contraseña.")}</p>}
      <div className="flex flex-col gap-6">
        <UserForm
          locale={user.locale}
          teams={teams}
          isSelf={p.id === user.id}
          values={{ id: p.id, fullName: p.fullName, email: p.email ?? "", teamId: p.teamId ?? "", roles: roles.map((r) => r.role), isAdmin: p.isAdmin, active: p.active, locale: p.locale }}
        />
        <ResetPasswordForm locale={user.locale} id={p.id} />
      </div>
    </AppShell>
  );
}
