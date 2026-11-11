import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { canApprovePurchases, canBuy, canReceive, canSeePurchasing, getCurrentUser } from "@/lib/session";
import { dateFmt, tr, usd } from "@/lib/i18n";
import { getSettings } from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { NoDatabase } from "@/components/no-database";
import { Badge, btn } from "@/components/ui";
import { addQuote, approveOrder, chooseQuote, createOrders, receiveOrder, rejectOrder } from "./actions";

export const dynamic = "force-dynamic";

export default async function Compras({ searchParams }: { searchParams: Promise<{ vista?: string; e?: string }> }) {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  const loc = user.locale;
  if (!canSeePurchasing(user)) redirect("/proyectos");
  const { vista, e } = await searchParams;
  const view = vista === "ordenes" ? "ordenes" : "faltantes";
  const buy = canBuy(user);
  const settings = await getSettings(user.companyId);

  const shortages = await db
    .select({ r: s.purchaseRequests, material: s.materials.name, unit: s.materials.unit })
    .from(s.purchaseRequests)
    .innerJoin(s.materials, eq(s.materials.id, s.purchaseRequests.materialId))
    .where(eq(s.purchaseRequests.companyId, user.companyId))
    .orderBy(asc(s.materials.name));
  const open = shortages.filter((x) => ["open", "quoting"].includes(x.r.status));
  const ids = open.map((x) => x.r.id);
  const quotes = ids.length
    ? await db
        .select({ q: s.quotes, supplier: s.suppliers.name })
        .from(s.quotes)
        .innerJoin(s.suppliers, eq(s.suppliers.id, s.quotes.supplierId))
        .where(inArray(s.quotes.purchaseRequestId, ids))
        .orderBy(asc(s.quotes.unitPrice))
    : [];
  const suppliers = await db.select().from(s.suppliers).where(eq(s.suppliers.companyId, user.companyId)).orderBy(asc(s.suppliers.name));
  const projectIds = [...new Set(open.flatMap((x) => x.r.projectIds))];
  const projects = projectIds.length ? await db.select({ id: s.projects.id, name: s.projects.name }).from(s.projects).where(inArray(s.projects.id, projectIds)) : [];
  const projName = new Map(projects.map((p) => [p.id, p.name]));

  const orders = await db
    .select({ o: s.purchaseOrders, supplier: s.suppliers.name, approver: s.users.fullName })
    .from(s.purchaseOrders)
    .innerJoin(s.suppliers, eq(s.suppliers.id, s.purchaseOrders.supplierId))
    .leftJoin(s.users, eq(s.users.id, s.purchaseOrders.approvedById))
    .where(eq(s.purchaseOrders.companyId, user.companyId))
    .orderBy(desc(s.purchaseOrders.number));
  const orderLines = orders.length
    ? await db
        .select({ r: s.purchaseRequests, material: s.materials.name, unit: s.materials.unit })
        .from(s.purchaseRequests)
        .innerJoin(s.materials, eq(s.materials.id, s.purchaseRequests.materialId))
        .where(inArray(s.purchaseRequests.purchaseOrderId, orders.map((o) => o.o.id)))
    : [];
  const pendingApproval = orders.filter((o) => o.o.status === "pending_approval");
  const readyToOrder = open.filter((x) => quotes.some((q) => q.q.purchaseRequestId === x.r.id && q.q.chosen));

  const poStatus = (st: string) =>
    ({
      pending_approval: { label: t("Needs approval", "Espera aprobación"), tone: "warning" as const },
      ordered: { label: t("Ordered", "Pedida"), tone: "info" as const },
      received: { label: t("Received", "Recibida"), tone: "success" as const },
      cancelled: { label: t("Rejected", "Rechazada"), tone: "neutral" as const },
    })[st] ?? { label: st, tone: "neutral" as const };

  const errors: Record<string, string> = {
    price: t("Enter a price greater than 0.", "Escribe un precio mayor a 0."),
    perm: t("You don't have permission for that.", "No tienes permiso para eso."),
    nothing: t("Nothing is ready to order. Choose a quote first.", "No hay nada listo para ordenar. Elige una cotización primero."),
    notfound: t("That record was not found.", "No se encontró ese registro."),
    state: t("That order is not in the right state.", "Esa orden no está en el estado correcto."),
    nowarehouse: t("There is no warehouse set up.", "No hay bodega configurada."),
  };
  const field = "h-10 rounded-md border border-border-strong bg-surface px-2 text-sm";

  return (
    <AppShell user={user} active="purchasing">
      <header className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink-muted">
            {t("Approval needed above", "Se aprueba por encima de")} {usd(settings.approvalThreshold)}
          </p>
          <h1 className="text-3xl font-bold">{t("Purchasing", "Compras")}</h1>
        </div>
        <nav className="flex gap-2" aria-label={t("View", "Vista")}>
          {[
            ["faltantes", `${t("Shortages", "Faltantes")} (${open.length})`],
            ["ordenes", `${t("Orders", "Órdenes")}${pendingApproval.length ? ` · ${pendingApproval.length} ${t("to approve", "por aprobar")}` : ""}`],
          ].map(([k, label]) => (
            <Link
              key={k}
              href={`/compras?vista=${k}`}
              aria-current={view === k ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${view === k ? "border-andy-black bg-andy-black text-white" : "border-border-strong bg-surface hover:bg-subtle"}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {e && errors[e] && (
        <p role="alert" className="mb-4 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {errors[e]}
        </p>
      )}

      {view === "faltantes" && (
        <div className="flex flex-col gap-3">
          {open.length === 0 && (
            <p className="rounded-lg border border-dashed border-border-strong px-4 py-12 text-center text-sm text-ink-muted">
              {t("No shortages. When a delivery comes up short, the missing material lands here.", "No hay faltantes. Cuando una entrega quede corta, lo que falte aparece aquí.")}
            </p>
          )}
          {buy && readyToOrder.length > 0 && (
            <form action={createOrders} className="flex flex-wrap items-center gap-3 rounded-lg border border-andy-gold bg-andy-gold-50 p-4">
              <p className="flex-1 text-sm text-andy-gold-dark">
                {readyToOrder.length} {t("shortages have a chosen quote. Create the purchase orders (one per supplier).", "faltantes ya tienen cotización elegida. Crea las órdenes de compra (una por proveedor).")}
              </p>
              <button className={btn.accent}>{t("Create purchase orders", "Crear órdenes de compra")}</button>
            </form>
          )}
          {open.map(({ r, material, unit }) => {
            const qs = quotes.filter((q) => q.q.purchaseRequestId === r.id);
            return (
              <section key={r.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="flex-1 font-semibold">
                    {material} <span className="font-normal text-ink-muted">· {Number(r.qty)} {unit}</span>
                  </h2>
                  <Badge tone={r.status === "quoting" ? "warning" : "danger"}>{r.status === "quoting" ? t("Quoting", "Cotizando") : t("Missing", "Falta")}</Badge>
                </div>
                <p className="text-xs text-ink-muted">
                  {t("For", "Para")}: {r.projectIds.map((id) => projName.get(id) ?? "—").join(", ") || "—"} · {dateFmt(loc, r.createdAt, false)}
                </p>
                {qs.length > 0 && (
                  <ul className="mt-3 divide-y divide-border rounded-md border border-border">
                    {qs.map(({ q, supplier }) => (
                      <li key={q.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                        <span className="flex-1 font-semibold">{supplier}</span>
                        <span>{usd(Number(q.unitPrice))} / {unit}</span>
                        <span className="text-ink-muted">{q.leadTimeDays != null ? `${q.leadTimeDays} ${t("days", "días")}` : ""}</span>
                        {q.chosen ? (
                          <Badge tone="success">{t("Chosen", "Elegida")}</Badge>
                        ) : (
                          buy && (
                            <form action={chooseQuote}>
                              <input type="hidden" name="quoteId" value={q.id} />
                              <button className={btn.small}>{t("Choose", "Elegir")}</button>
                            </form>
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {buy && (
                  <form action={addQuote} className="mt-3 flex flex-wrap items-end gap-2">
                    <input type="hidden" name="requestId" value={r.id} />
                    <label className="flex flex-col gap-1 text-xs font-semibold">
                      {t("Supplier", "Proveedor")}
                      <select name="supplierId" className={field}>
                        {suppliers.map((x) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold">
                      {t("…or new", "…o nuevo")}
                      <input name="newSupplier" className={`${field} w-32`} aria-label={t("New supplier", "Proveedor nuevo")} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold">
                      {t("Unit price (USD)", "Precio unitario (USD)")}
                      <input name="unitPrice" inputMode="decimal" required className={`${field} w-28`} />
                    </label>
                    <label className="flex flex-col gap-1 text-xs font-semibold">
                      {t("Days", "Días")}
                      <input name="leadTimeDays" inputMode="numeric" className={`${field} w-16`} />
                    </label>
                    <button className={btn.small}>{t("Add quote", "Agregar cotización")}</button>
                  </form>
                )}
              </section>
            );
          })}
        </div>
      )}

      {view === "ordenes" && (
        <div className="flex flex-col gap-3">
          {orders.length === 0 && (
            <p className="rounded-lg border border-dashed border-border-strong px-4 py-12 text-center text-sm text-ink-muted">
              {t("No purchase orders yet.", "Todavía no hay órdenes de compra.")}
            </p>
          )}
          {orders.map(({ o, supplier, approver }) => {
            const info = poStatus(o.status);
            const lines = orderLines.filter((l) => l.r.purchaseOrderId === o.id);
            return (
              <section key={o.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="flex-1 font-semibold">
                    PO #{o.number} · {supplier} <span className="font-normal text-ink-muted">· {usd(Number(o.total))}</span>
                  </h2>
                  <Badge tone={info.tone}>{info.label}</Badge>
                </div>
                <p className="text-xs text-ink-muted">
                  {dateFmt(loc, o.createdAt)}
                  {approver ? ` · ${t("approved by", "aprobada por")} ${approver}` : ""}
                </p>
                <ul className="mt-2 text-sm">
                  {lines.map(({ r, material, unit }) => (
                    <li key={r.id} className="flex justify-between border-b border-border py-1 last:border-b-0">
                      <span>{material}</span>
                      <span className="text-ink-muted">{Number(r.qty)} {unit} × {usd(Number(r.unitPrice))}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.status === "pending_approval" &&
                    (canApprovePurchases(user) ? (
                      <>
                        <form action={approveOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <button className={btn.smallAccent}>{t("Approve", "Aprobar")}</button>
                        </form>
                        <form action={rejectOrder}>
                          <input type="hidden" name="id" value={o.id} />
                          <button className={btn.small}>{t("Reject", "Rechazar")}</button>
                        </form>
                      </>
                    ) : (
                      <p className="text-sm text-andy-gold-dark">{t("Waiting for Miguel, Andrés or Karina to approve.", "Esperando que Miguel, Andrés o Karina aprueben.")}</p>
                    ))}
                  {o.status === "ordered" && canReceive(user) && (
                    <form action={receiveOrder}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className={btn.small}>{t("Mark received in warehouse", "Marcar recibida en bodega")}</button>
                    </form>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
