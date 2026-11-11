"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { schema as s } from "@/db";
import { canApprovePurchases, canBuy, canReceive, getCurrentUser, type CurrentUser } from "@/lib/session";
import { getSettings } from "@/lib/projects";
import { getWarehouseId, requireDb } from "@/lib/data";

async function need(check: (u: CurrentUser) => boolean) {
  const u = await getCurrentUser();
  if (!u) redirect("/entrar");
  if (!check(u)) redirect("/compras?e=perm");
  return u;
}
const back = (e?: string, vista = "faltantes"): never => redirect(`/compras?vista=${vista}${e ? `&e=${e}` : ""}`);

export async function addQuote(formData: FormData) {
  const u = await need(canBuy);
  const d = requireDb();
  const requestId = String(formData.get("requestId"));
  let supplierId = String(formData.get("supplierId") ?? "");
  const newName = String(formData.get("newSupplier") ?? "").trim();
  const price = Number(String(formData.get("unitPrice") ?? "").replace(",", "."));
  const lead = formData.get("leadTimeDays") ? Number(formData.get("leadTimeDays")) : null;
  if (!Number.isFinite(price) || price <= 0) back("price");
  const [req] = await d
    .select({ id: s.purchaseRequests.id })
    .from(s.purchaseRequests)
    .where(and(eq(s.purchaseRequests.id, requestId), eq(s.purchaseRequests.companyId, u.companyId), inArray(s.purchaseRequests.status, ["open", "quoting"])));
  if (!req) back("notfound");
  await d.transaction(async (tx) => {
    if (newName) {
      const [sup] = await tx.insert(s.suppliers).values({ companyId: u.companyId, name: newName }).returning({ id: s.suppliers.id });
      supplierId = sup.id;
    }
    const [ok] = await tx
      .select({ id: s.suppliers.id })
      .from(s.suppliers)
      .where(and(eq(s.suppliers.id, supplierId), eq(s.suppliers.companyId, u.companyId)));
    if (!ok) return;
    const existing = await tx.select({ id: s.quotes.id }).from(s.quotes).where(eq(s.quotes.purchaseRequestId, requestId));
    await tx.insert(s.quotes).values({
      purchaseRequestId: requestId,
      supplierId: ok.id,
      unitPrice: String(price),
      leadTimeDays: lead && Number.isFinite(lead) ? Math.round(lead) : null,
      chosen: existing.length === 0, // la primera queda elegida; Clara puede cambiarla
    });
    await tx.update(s.purchaseRequests).set({ status: "quoting" }).where(eq(s.purchaseRequests.id, requestId));
  });
  revalidatePath("/compras");
  back();
}

export async function chooseQuote(formData: FormData) {
  const u = await need(canBuy);
  const d = requireDb();
  const quoteId = String(formData.get("quoteId"));
  const [q] = await d
    .select({ id: s.quotes.id, requestId: s.quotes.purchaseRequestId })
    .from(s.quotes)
    .innerJoin(s.purchaseRequests, eq(s.purchaseRequests.id, s.quotes.purchaseRequestId))
    .where(and(eq(s.quotes.id, quoteId), eq(s.purchaseRequests.companyId, u.companyId)));
  if (!q) back("notfound");
  await d.transaction(async (tx) => {
    await tx.update(s.quotes).set({ chosen: false }).where(eq(s.quotes.purchaseRequestId, q.requestId));
    await tx.update(s.quotes).set({ chosen: true }).where(eq(s.quotes.id, quoteId));
  });
  revalidatePath("/compras");
  back();
}

/** Convierte lo cotizado en órdenes de compra, una por proveedor. Si pasa del monto límite, espera aprobación. */
export async function createOrders() {
  const u = await need(canBuy);
  const d = requireDb();
  const { approvalThreshold } = await getSettings(u.companyId);
  const rows = await d
    .select({
      id: s.purchaseRequests.id,
      qty: s.purchaseRequests.qty,
      supplierId: s.quotes.supplierId,
      price: s.quotes.unitPrice,
    })
    .from(s.purchaseRequests)
    .innerJoin(s.quotes, and(eq(s.quotes.purchaseRequestId, s.purchaseRequests.id), eq(s.quotes.chosen, true)))
    .where(and(eq(s.purchaseRequests.companyId, u.companyId), eq(s.purchaseRequests.status, "quoting")));
  if (!rows.length) back("nothing");
  const bySupplier = new Map<string, typeof rows>();
  for (const r of rows) bySupplier.set(r.supplierId, [...(bySupplier.get(r.supplierId) ?? []), r]);

  await d.transaction(async (tx) => {
    for (const [supplierId, lines] of bySupplier) {
      const [{ n }] = await tx
        .select({ n: sql<number>`coalesce(max(${s.purchaseOrders.number}), 2000)::int` })
        .from(s.purchaseOrders)
        .where(eq(s.purchaseOrders.companyId, u.companyId));
      const total = lines.reduce((sum, l) => sum + Number(l.qty) * Number(l.price), 0);
      const needsApproval = total > approvalThreshold;
      const [po] = await tx
        .insert(s.purchaseOrders)
        .values({
          companyId: u.companyId,
          number: n + 1,
          supplierId,
          total: total.toFixed(2),
          status: needsApproval ? "pending_approval" : "ordered",
          approvedById: needsApproval ? null : u.id,
          approvedAt: needsApproval ? null : new Date(),
        })
        .returning({ id: s.purchaseOrders.id });
      for (const l of lines)
        await tx
          .update(s.purchaseRequests)
          .set({ purchaseOrderId: po.id, unitPrice: l.price, status: needsApproval ? "pending_approval" : "ordered" })
          .where(eq(s.purchaseRequests.id, l.id));
    }
  });
  revalidatePath("/compras");
  back(undefined, "ordenes");
}

async function loadOrder(u: CurrentUser, id: string) {
  const d = requireDb();
  const [po] = await d
    .select()
    .from(s.purchaseOrders)
    .where(and(eq(s.purchaseOrders.id, id), eq(s.purchaseOrders.companyId, u.companyId)));
  if (!po) back("notfound", "ordenes");
  return { d, po };
}

export async function approveOrder(formData: FormData) {
  const u = await need(canApprovePurchases);
  const { d, po } = await loadOrder(u, String(formData.get("id")));
  if (po.status !== "pending_approval") back(undefined, "ordenes");
  await d.transaction(async (tx) => {
    await tx.update(s.purchaseOrders).set({ status: "ordered", approvedById: u.id, approvedAt: new Date() }).where(eq(s.purchaseOrders.id, po.id));
    await tx.update(s.purchaseRequests).set({ status: "ordered" }).where(eq(s.purchaseRequests.purchaseOrderId, po.id));
  });
  revalidatePath("/compras");
  back(undefined, "ordenes");
}

/** Rechazar devuelve los faltantes a cotización para que Clara busque otra opción. */
export async function rejectOrder(formData: FormData) {
  const u = await need(canApprovePurchases);
  const { d, po } = await loadOrder(u, String(formData.get("id")));
  if (po.status !== "pending_approval") back(undefined, "ordenes");
  await d.transaction(async (tx) => {
    await tx.update(s.purchaseRequests).set({ status: "quoting", purchaseOrderId: null, unitPrice: null }).where(eq(s.purchaseRequests.purchaseOrderId, po.id));
    await tx.update(s.purchaseOrders).set({ status: "cancelled" }).where(eq(s.purchaseOrders.id, po.id));
  });
  revalidatePath("/compras");
  back(undefined, "ordenes");
}

/** Llegó el material: entra a la bodega como movimiento y se recalcula el costo promedio. */
export async function receiveOrder(formData: FormData) {
  const u = await need(canReceive);
  const { d, po } = await loadOrder(u, String(formData.get("id")));
  if (po.status !== "ordered") back("state", "ordenes");
  const warehouse = await getWarehouseId(u.companyId);
  if (!warehouse) back("nowarehouse", "ordenes");
  await d.transaction(async (tx) => {
    const lines = await tx.select().from(s.purchaseRequests).where(eq(s.purchaseRequests.purchaseOrderId, po.id));
    for (const l of lines) {
      const qty = Number(l.qty);
      const price = Number(l.unitPrice ?? 0);
      const [stock] = await tx.execute<{ qty: string | null }>(
        sql`select coalesce(sum(qty), 0) as qty from stock_by_location where material_id = ${l.materialId}`,
      );
      const have = Math.max(0, Number(stock?.qty ?? 0));
      const [m] = await tx.select({ avg: s.materials.avgCost }).from(s.materials).where(eq(s.materials.id, l.materialId));
      const avg = have + qty > 0 ? (have * Number(m?.avg ?? price) + qty * price) / (have + qty) : price;
      await tx.update(s.materials).set({ avgCost: avg.toFixed(4) }).where(eq(s.materials.id, l.materialId));
      await tx.insert(s.movements).values({
        companyId: u.companyId,
        kind: "receipt",
        materialId: l.materialId,
        qty: String(qty),
        toLocationId: warehouse,
        unitCost: String(price),
        userId: u.id,
        note: `PO #${po.number}`,
      });
    }
    await tx.update(s.purchaseRequests).set({ status: "received" }).where(eq(s.purchaseRequests.purchaseOrderId, po.id));
    await tx.update(s.purchaseOrders).set({ status: "received" }).where(eq(s.purchaseOrders.id, po.id));
  });
  revalidatePath("/compras");
  revalidatePath("/bodega");
  back(undefined, "ordenes");
}
