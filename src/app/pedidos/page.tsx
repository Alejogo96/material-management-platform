import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { canSeeCosts, getCurrentUser } from "@/lib/session";
import { dateFmt, tr } from "@/lib/i18n";
import { listRequests } from "@/lib/data";
import { listProjects, statusInfo } from "@/lib/projects";
import { requestKindLabel, requestStatusInfo } from "@/lib/labels";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";

export const dynamic = "force-dynamic";
const OPEN = ["sent", "preparing", "ready", "partial"];

export default async function PedidosPorProyecto({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!canSeeCosts(user)) redirect("/campo");
  const t = tr(user.locale);
  const { ver } = await searchParams;
  const onlyOpen = ver === "abiertos";
  const [requests, projects] = await Promise.all([listRequests(user.companyId), listProjects(user.companyId)]);
  const groups = projects
    .map((p) => ({ p, rows: requests.filter((r) => r.projectId === p.id && (!onlyOpen || OPEN.includes(r.status))) }))
    .filter((g) => g.rows.length > 0 || (!onlyOpen && g.p.status !== "closed"));
  const openCount = requests.filter((r) => OPEN.includes(r.status)).length;

  return (
    <AppShell user={user} active="orders">
      <header className="mb-5 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink-muted">
            {requests.length} {requests.length === 1 ? t("order", "pedido") : t("orders", "pedidos")} · {openCount} {t("open", "abiertos")}
          </p>
          <h1 className="text-3xl font-bold">{t("Orders by project", "Pedidos por proyecto")}</h1>
        </div>
        <nav className="flex gap-2" aria-label={t("Filter", "Filtro")}>
          {[
            ["", t("All", "Todos")],
            ["abiertos", t("Open only", "Solo abiertos")],
          ].map(([k, label]) => (
            <Link
              key={k}
              href={k ? `/pedidos?ver=${k}` : "/pedidos"}
              aria-current={(k === "abiertos") === onlyOpen ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                (k === "abiertos") === onlyOpen ? "border-andy-black bg-andy-black text-white" : "border-border-strong bg-surface hover:bg-subtle"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {groups.length === 0 && (
        <p className="rounded-lg border border-dashed border-border-strong px-4 py-12 text-center text-sm text-ink-muted">
          {t("No orders yet. When a van leader orders from the phone, it shows up here.", "Todavía no hay pedidos. Cuando un líder pida desde el celular, aparecerá aquí.")}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {groups.map(({ p, rows }) => {
          const st = statusInfo(t, p.status);
          return (
            <details key={p.id} open={rows.some((r) => OPEN.includes(r.status))} className="group rounded-lg border border-border bg-surface">
              <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="font-heading font-bold">{p.name}</span>
                <Badge tone={st.tone}>{st.label}</Badge>
                <span className="flex-1 text-sm text-ink-muted">
                  {t("Lead", "Encargado")}: {p.lead ?? "—"} · {p.van ?? t("no van", "sin van")} · {rows.length} {rows.length === 1 ? t("order", "pedido") : t("orders", "pedidos")}
                </span>
                <Link href={`/proyectos/${p.id}`} className="text-sm font-semibold text-andy-red">
                  {t("Open project", "Abrir proyecto")} →
                </Link>
              </summary>
              {rows.length === 0 ? (
                <p className="border-t border-border px-4 py-4 text-sm text-ink-muted">{t("No orders for this project yet.", "Este proyecto todavía no tiene pedidos.")}</p>
              ) : (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full min-w-[560px] text-sm">
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-page">
                          <td className="px-4 py-3 font-semibold">
                            <Link href={`/bodega/pedido/${r.id}`} className="text-andy-red hover:underline">#{r.number}</Link>
                          </td>
                          <td className="px-4 py-3">{requestKindLabel(t, r.kind)}</td>
                          <td className="px-4 py-3">{r.requester}</td>
                          <td className="px-4 py-3 text-ink-muted">{r.lines} {t("lines", "líneas")}{r.unmatched ? ` · ${r.unmatched} ${t("to match", "por conciliar")}` : ""}</td>
                          <td className="px-4 py-3 text-ink-muted">{dateFmt(user.locale, r.createdAt)}</td>
                          <td className="px-4 py-3"><Badge tone={requestStatusInfo(t, r.status).tone}>{requestStatusInfo(t, r.status).label}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </details>
          );
        })}
      </div>
    </AppShell>
  );
}
