import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCatalogForSearch, getRequest } from "@/lib/data";
import { requestKindLabel, requestStatusInfo, lineStateInfo } from "@/lib/labels";
import { dateFmt, tr } from "@/lib/i18n";
import { search } from "@/lib/search";
import { Badge, btn } from "@/components/ui";
import { deliverFromWarehouse, markPreparing, markReady, matchLine } from "@/app/actions";

export const metadata = { title: "Order · Andy Electric" };

export default async function PedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const req = await getRequest(user.companyId, id);
  if (!req) notFound();

  const t = tr(user.locale);
  const loc = user.locale;
  const staff = user.roles.some((r) => ["warehouse", "owner"].includes(r));
  const unmatched = req.lines.filter((l) => l.state === "unmatched");
  const catalog = unmatched.length ? await getCatalogForSearch(user.companyId) : [];
  const open = !["delivered", "closed", "cancelled"].includes(req.status);
  const canDeliver = open && req.lines.some((l) => l.state === "available" || l.state === "partial");

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/proyectos/${req.projectId}`} className="text-sm font-semibold text-andy-red">
        ← {req.projectName}
      </Link>
      <header className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink-muted">
            {requestKindLabel(t, req.kind)} · {t("ordered by", "pedido por")} {req.requester} · {t("pickup", "recoger")} {dateFmt(loc, req.neededAt)}
          </p>
          <h1 className="text-3xl font-bold">
            {t("Order", "Pedido")} #{req.number} · {req.projectName}
          </h1>
        </div>
        <Badge tone={requestStatusInfo(t, req.status).tone}>{requestStatusInfo(t, req.status).label}</Badge>
      </header>

      {req.note && <p className="rounded-md bg-andy-gold-50 px-4 py-3 text-sm text-andy-gold-dark">{t("Note", "Nota")}: {req.note}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-subtle text-left text-[11px] tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">{t("MATERIAL", "MATERIAL")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("ORDERED", "PEDIDO")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("DELIVERED", "ENTREGADO")}</th>
                <th className="px-4 py-2.5 text-right font-semibold">{t("IN WAREHOUSE", "EN BODEGA")}</th>
                <th className="px-4 py-2.5 font-semibold">{t("STATUS", "ESTADO")}</th>
              </tr>
            </thead>
            <tbody>
              {req.lines.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{l.name ?? `“${l.freeText}”`}</td>
                  <td className="px-4 py-3 text-right">
                    {l.requested} {l.unit ?? ""}
                  </td>
                  <td className="px-4 py-3 text-right">{l.delivered}</td>
                  <td className="px-4 py-3 text-right">{l.materialId ? l.available : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={lineStateInfo(t, l.state).tone}>{lineStateInfo(t, l.state).label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="flex flex-col gap-4">
          {open && staff && (
            <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="font-semibold">{t("Actions", "Acciones")}</h2>
              {req.status === "sent" && (
                <form action={markPreparing}>
                  <input type="hidden" name="id" value={req.id} />
                  <button className={`${btn.secondary} w-full`}>{t("Start preparing", "Empezar a preparar")}</button>
                </form>
              )}
              {["sent", "preparing"].includes(req.status) && (
                <form action={markReady}>
                  <input type="hidden" name="id" value={req.id} />
                  <button className={`${btn.accent} w-full`}>{t("Mark as ready", "Marcar como listo")}</button>
                </form>
              )}
              {canDeliver && (
                <form action={deliverFromWarehouse}>
                  <input type="hidden" name="id" value={req.id} />
                  <button className={`${btn.primary} w-full`}>{t("Deliver now", "Entregar ahora")}</button>
                </form>
              )}
              <p className="text-xs text-ink-muted">
                {t("On delivery the warehouse stock is deducted automatically and anything missing goes to purchasing.", "Al entregar, el stock de bodega se descuenta solo y lo que falte pasa a compras.")}
              </p>
            </section>
          )}

          {staff && unmatched.map((l) => {
            const suggestions = search(catalog, l.freeText ?? "", 3);
            return (
              <section key={l.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
                <h2 className="font-semibold">{t("Match free text", "Conciliar texto libre")}</h2>
                <p className="text-sm text-ink-muted">“{l.freeText}”</p>
                {suggestions.length === 0 && (
                  <p className="text-xs text-ink-muted">{t("No suggestions. Look it up in the catalog.", "Sin sugerencias. Búscalo en el catálogo.")}</p>
                )}
                {suggestions.map(({ item }) => (
                  <form key={item.id} action={matchLine} className="flex items-center gap-2">
                    <input type="hidden" name="lineId" value={l.id} />
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="materialId" value={item.id} />
                    <span className="flex-1 text-sm">{item.name}</span>
                    <button className={btn.small}>{t("Use", "Usar")}</button>
                  </form>
                ))}
                <p className="text-xs text-ink-muted">{t("The text is saved as an alias for next time.", "El texto se guarda como alias para la próxima vez.")}</p>
              </section>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
