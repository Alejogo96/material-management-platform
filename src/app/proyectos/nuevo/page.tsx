import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { canCreateProject, getCurrentUser } from "@/lib/session";
import { tr } from "@/lib/i18n";
import { listPeople, listVans } from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { NoDatabase } from "@/components/no-database";
import { NewProjectForm } from "./new-project-form";

export const dynamic = "force-dynamic";

export default async function NuevoProyecto() {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  if (!canCreateProject(user)) {
    return (
      <AppShell user={user} active="projects">
        <div className="flex max-w-xl flex-col gap-3">
          <h1 className="text-3xl font-bold">{t("You can't create projects", "No puedes crear proyectos")}</h1>
          <p className="text-ink-muted">
            {t(
              "Jimmy, Alex, El Niño, Andrés and Miguel create projects. Ask one of them to set it up.",
              "Jimmy, Alex, El Niño, Andrés y Miguel crean los proyectos. Pídele a uno de ellos que lo cree.",
            )}
          </p>
          <Link href="/proyectos" className="font-semibold text-andy-red">
            ← {t("Back to projects", "Volver a proyectos")}
          </Link>
        </div>
      </AppShell>
    );
  }
  const [people, vans] = await Promise.all([listPeople(user.companyId), listVans(user.companyId)]);
  return (
    <AppShell user={user} active="projects">
      <Link href="/proyectos" className="text-sm font-semibold text-andy-red">
        ← {t("Projects", "Proyectos")}
      </Link>
      <h1 className="mt-1 mb-6 text-3xl font-bold">{t("New project", "Nuevo proyecto")}</h1>
      <NewProjectForm locale={user.locale} people={people} vans={vans} defaultLead={user.id} />
    </AppShell>
  );
}
