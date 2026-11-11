import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { canCreateProject, getCurrentUser } from "@/lib/session";
import { dateFmt, tr } from "@/lib/i18n";
import { listProjects, statusInfo, typeLabel } from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { Badge, btn } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";

export const dynamic = "force-dynamic";

export default async function Proyectos({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  const { estado } = await searchParams;
  const all = await listProjects(user.companyId);
  const filter = ["estimating", "active", "paused", "closed"].includes(estado ?? "") ? estado! : "all";
  const rows = filter === "all" ? all : all.filter((p) => p.status === filter);
  const tabs = [
    ["all", t("All", "Todos")],
    ["active", t("Active", "Activos")],
    ["estimating", t("Estimating", "Estimando")],
    ["paused", t("Paused", "En pausa")],
    ["closed", t("Closed", "Cerrados")],
  ] as const;

  return (
    <AppShell user={user} active="projects">
      <header className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink-muted">{t("Every order, tied to its project", "Cada pedido, ligado a su proyecto")}</p>
          <h1 className="text-3xl font-bold">{t("Projects", "Proyectos")}</h1>
        </div>
        {canCreateProject(user) ? (
          <Link href="/proyectos/nuevo" className={`${btn.accent} w-full sm:w-auto`}>
            + {t("New project", "Nuevo proyecto")}
          </Link>
        ) : (
          <p className="text-xs text-ink-muted">{t("Need a new project? Ask Jimmy, Alex, El Niño, Andrés or Miguel.", "¿Necesitas un proyecto nuevo? Pídeselo a Jimmy, Alex, El Niño, Andrés o Miguel.")}</p>
        )}
      </header>

      <nav aria-label={t("Filter by status", "Filtrar por estado")} className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map(([k, label]) => (
          <Link
            key={k}
            href={k === "all" ? "/proyectos" : `/proyectos?estado=${k}`}
            aria-current={filter === k ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              filter === k ? "border-andy-black bg-andy-black text-white" : "border-border-strong bg-surface hover:bg-subtle"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong px-4 py-12 text-center">
          <p className="font-semibold">{t("No projects here yet", "Todavía no hay proyectos aquí")}</p>
          <p className="mt-1 text-sm text-ink-muted">{t("Create one to start tracking its material.", "Crea uno para empezar a seguir su material.")}</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const st = statusInfo(t, p.status);
            return (
              <li key={p.id}>
                <Link href={`/proyectos/${p.id}`} className="flex h-full flex-col gap-2 rounded-lg border border-border bg-surface p-4 hover:border-border-strong">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink-muted">{p.code} · {typeLabel(t, p.type, p.typeOther)}</p>
                      <p className="font-heading text-lg font-bold">{p.name}</p>
                      <p className="truncate text-sm text-ink-muted">{p.address ?? "—"}</p>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <p className="text-sm">
                    {t("Lead", "Encargado")}: <strong>{p.lead ?? "—"}</strong> · {p.van ?? t("no van", "sin van")}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {t("Orders", "Pedidos")}: {p.orders}
                    {p.openOrders ? ` (${p.openOrders} ${t("open", "abiertos")})` : ""} · {t("Phases", "Fases")}: {p.phasesDone}/{p.phasesTotal} · {t("Started", "Inicio")} {dateFmt(user.locale, p.createdAt, false)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
