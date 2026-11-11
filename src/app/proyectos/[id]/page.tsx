import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { canCreateProject, canSeeCosts, getCurrentUser } from "@/lib/session";
import { dateFmt, tr, usd } from "@/lib/i18n";
import { listRequests } from "@/lib/data";
import {
  eventText,
  getProject,
  getSettings,
  inspectionLabel,
  listPeople,
  listVans,
  phaseStatusLabel,
  statusInfo,
  typeLabel,
} from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { Badge, btn } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";
import { requestKindLabel, requestStatusInfo } from "@/lib/labels";
import { setInspectionStatus, setPhaseStatus, setProjectLead, setProjectStatus, setProjectVan } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProyectoDetalle({ params }: { params: Promise<{ id: string }> }) {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const p = await getProject(user.companyId, id);
  if (!p) notFound();
  const t = tr(user.locale);
  const loc = user.locale;
  const manage = canCreateProject(user);
  const costs = canSeeCosts(user);
  const [orders, people, vans, settings] = await Promise.all([
    listRequests(user.companyId, { projectId: id }),
    manage ? listPeople(user.companyId) : Promise.resolve([]),
    manage ? listVans(user.companyId) : Promise.resolve([]),
    getSettings(user.companyId),
  ]);
  const st = statusInfo(t, p.status);
  const budget = Number(p.materialBudget ?? 0);
  const base = p.estimated || budget;
  const over = base > 0 && p.issued > base * (1 + settings.excessPct / 100);
  const pct = base > 0 ? Math.min(100, Math.round((p.issued / base) * 100)) : 0;
  const sel = "h-10 rounded-md border border-border-strong bg-surface px-2 text-sm";

  return (
    <AppShell user={user} active="projects">
      <Link href="/proyectos" className="text-sm font-semibold text-andy-red">
        ← {t("Projects", "Proyectos")}
      </Link>
      <header className="mt-1 mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink-muted">
            {p.code} · {typeLabel(t, p.type, p.typeOther)}
          </p>
          <h1 className="text-3xl font-bold">{p.name}</h1>
          <p className="text-ink-muted">{p.address}</p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
      </header>

      <section className="mb-6 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [t("Lead in charge", "Encargado"), p.leadName ?? "—"],
          [t("Team / van", "Equipo / van"), p.vanName ?? "—"],
          [t("Created by", "Creado por"), p.creatorName ?? "—"],
          [t("Created", "Creado"), dateFmt(loc, p.createdAt, false)],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{k}</p>
            <p className="font-semibold">{v}</p>
          </div>
        ))}
        {p.clientName && (
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("Client", "Cliente")}</p>
            <p className="font-semibold">{p.clientName}</p>
          </div>
        )}
      </section>

      {manage && (
        <section className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-border bg-surface p-4">
          <form action={setProjectStatus} className="flex items-end gap-2">
            <input type="hidden" name="id" value={p.id} />
            <label className="flex flex-col gap-1 text-xs font-semibold">
              {t("Status", "Estado")}
              <select name="status" defaultValue={p.status} className={sel}>
                {(["estimating", "active", "paused", "closed"] as const).map((k) => (
                  <option key={k} value={k}>{statusInfo(t, k).label}</option>
                ))}
              </select>
            </label>
            <button className={btn.small}>{t("Save", "Guardar")}</button>
          </form>
          <form action={setProjectLead} className="flex items-end gap-2">
            <input type="hidden" name="id" value={p.id} />
            <label className="flex flex-col gap-1 text-xs font-semibold">
              {t("Lead", "Encargado")}
              <select name="leadId" defaultValue={p.managerId ?? ""} className={sel}>
                {people.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </label>
            <button className={btn.small}>{t("Save", "Guardar")}</button>
          </form>
          <form action={setProjectVan} className="flex items-end gap-2">
            <input type="hidden" name="id" value={p.id} />
            <label className="flex flex-col gap-1 text-xs font-semibold">
              {t("Team / van", "Equipo / van")}
              <select name="vanId" defaultValue={p.vanId ?? ""} className={sel}>
                {vans.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </label>
            <button className={btn.small}>{t("Save", "Guardar")}</button>
          </form>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          {costs && (
            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="mb-3 font-semibold">{t("Material: estimated vs delivered", "Material: estimado vs entregado")}</h2>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-ink-muted">{t("Budget", "Presupuesto")}</p><p className="font-heading text-xl font-bold">{budget ? usd(budget) : "—"}</p></div>
                <div><p className="text-xs text-ink-muted">{t("Estimated", "Estimado")}</p><p className="font-heading text-xl font-bold">{p.estimated ? usd(p.estimated) : "—"}</p></div>
                <div><p className="text-xs text-ink-muted">{t("Delivered so far", "Entregado a la fecha")}</p><p className={`font-heading text-xl font-bold ${over ? "text-danger" : ""}`}>{usd(p.issued)}</p></div>
              </div>
              {base > 0 && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-subtle" role="img" aria-label={`${pct}%`}>
                    <div className={`h-full ${over ? "bg-andy-red" : "bg-andy-gold"}`} style={{ width: `${pct}%` }} />
                  </div>
                  {over && (
                    <p className="mt-2 text-sm text-danger">
                      {t(`Over the estimate by more than ${settings.excessPct}%. Review the next orders.`, `Pasó el estimado por más de ${settings.excessPct}%. Revisa los próximos pedidos.`)}
                    </p>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="rounded-lg border border-border bg-surface">
            <h2 className="border-b border-border px-4 py-3 font-semibold">{t("Orders", "Pedidos")} ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">{t("No orders for this project yet.", "Este proyecto todavía no tiene pedidos.")}</p>
            ) : (
              <ul>
                {orders.map((r) => (
                  <li key={r.id} className="border-b border-border last:border-b-0">
                    <Link href={`/bodega/pedido/${r.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-page">
                      <span className="font-semibold text-andy-red">#{r.number}</span>
                      <span className="flex-1 text-sm text-ink-muted">
                        {requestKindLabel(t, r.kind)} · {r.requester} · {r.lines} {t("lines", "líneas")} · {dateFmt(loc, r.createdAt)}
                      </span>
                      <Badge tone={requestStatusInfo(t, r.status).tone}>{requestStatusInfo(t, r.status).label}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">{t("Phases", "Fases")}</h2>
            {p.phases.length === 0 && <p className="text-sm text-ink-muted">{t("No phases defined.", "Sin fases definidas.")}</p>}
            <ul className="flex flex-col gap-3">
              {p.phases.map((ph) => (
                <li key={ph.id} className="flex flex-col gap-1.5 border-b border-border pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 font-semibold">{ph.name}</span>
                    <Badge tone={ph.status === "done" ? "success" : ph.status === "in_progress" ? "warning" : "neutral"}>{phaseStatusLabel(t, ph.status)}</Badge>
                  </div>
                  {ph.spec && <p className="text-sm text-ink-muted">{ph.spec}</p>}
                  {manage && ph.status !== "done" && (
                    <form action={setPhaseStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="phaseId" value={ph.id} />
                      <input type="hidden" name="status" value={ph.status === "pending" ? "in_progress" : "done"} />
                      <button className={btn.small}>{ph.status === "pending" ? t("Start phase", "Empezar fase") : t("Mark done", "Marcar lista")}</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">{t("Inspections", "Revisiones")}</h2>
            {p.inspections.length === 0 && <p className="text-sm text-ink-muted">{t("No inspections required.", "Sin revisiones requeridas.")}</p>}
            <ul className="flex flex-col gap-3">
              {p.inspections.map((i) => {
                const info = inspectionLabel(t, i.status);
                return (
                  <li key={i.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 font-semibold">
                        {i.name}
                        {i.dueDate && <span className="ml-2 text-xs font-normal text-ink-muted">{dateFmt(loc, new Date(i.dueDate + "T12:00:00Z"), false)}</span>}
                      </span>
                      <Badge tone={info.tone}>{info.label}</Badge>
                    </div>
                    {manage && i.status === "pending" && (
                      <div className="flex gap-2">
                        {(["passed", "failed"] as const).map((s2) => (
                          <form key={s2} action={setInspectionStatus}>
                            <input type="hidden" name="id" value={p.id} />
                            <input type="hidden" name="inspectionId" value={i.id} />
                            <input type="hidden" name="status" value={s2} />
                            <button className={btn.small}>{inspectionLabel(t, s2).label}</button>
                          </form>
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-lg border border-border bg-surface p-4">
            <h2 className="mb-3 font-semibold">{t("History", "Histórico")}</h2>
            <ol className="flex flex-col gap-3 border-l-2 border-border pl-4">
              {p.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[22px] size-2.5 rounded-full bg-andy-red" aria-hidden />
                  <p>{eventText(t, e.kind, e.detail)}</p>
                  <p className="text-xs text-ink-muted">
                    {dateFmt(loc, e.createdAt)}
                    {e.user ? ` · ${e.user}` : ""}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
