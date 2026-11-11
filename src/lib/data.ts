import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

export function requireDb() {
  if (!db) throw new Error("La base de datos no está conectada (falta DATABASE_URL).");
  return db;
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "brand";

export async function getWarehouseId(companyId: string) {
  const d = requireDb();
  const [w] = await d
    .select({ id: s.locations.id })
    .from(s.locations)
    .where(and(eq(s.locations.companyId, companyId), eq(s.locations.kind, "warehouse")));
  return w?.id ?? null;
}

/** Stock disponible en una ubicación por material (suma de movimientos). */
export async function getStock(locationId: string, materialIds?: string[]) {
  const d = requireDb();
  const rows = await d.execute<{ material_id: string; qty: string }>(sql`
    select material_id, qty from stock_by_location
    where location_id = ${locationId}
    ${materialIds?.length ? sql`and material_id in ${materialIds}` : sql``}
  `);
  return new Map(rows.map((r) => [r.material_id, Number(r.qty)]));
}

export async function getCatalogForSearch(companyId: string) {
  const d = requireDb();
  const mats = await d
    .select()
    .from(s.materials)
    .where(and(eq(s.materials.companyId, companyId), eq(s.materials.active, true)))
    .orderBy(asc(s.materials.name));
  const aliases = await d
    .select({ materialId: s.materialAliases.materialId, alias: s.materialAliases.alias })
    .from(s.materialAliases)
    .innerJoin(s.materials, eq(s.materials.id, s.materialAliases.materialId))
    .where(eq(s.materials.companyId, companyId));
  const byMat = new Map<string, string[]>();
  for (const a of aliases) byMat.set(a.materialId, [...(byMat.get(a.materialId) ?? []), a.alias]);
  const warehouse = await getWarehouseId(companyId);
  const stock = warehouse ? await getStock(warehouse) : new Map<string, number>();
  return mats.map((m) => ({
    id: m.id,
    sku: m.sku,
    name: m.name,
    category: m.category,
    unit: m.unit,
    aliases: byMat.get(m.id) ?? [],
    stock: stock.get(m.id) ?? 0,
  }));
}

export async function getActiveProjects(companyId: string) {
  const d = requireDb();
  return d
    .select({ id: s.projects.id, code: s.projects.code, name: s.projects.name, kind: s.projects.kind })
    .from(s.projects)
    .where(and(eq(s.projects.companyId, companyId), inArray(s.projects.status, ["estimating", "active"])))
    .orderBy(asc(s.projects.name));
}

export async function listRequests(companyId: string, opts: { requestedById?: string; projectId?: string } = {}) {
  const d = requireDb();
  const where = [eq(s.materialRequests.companyId, companyId)];
  if (opts.requestedById) where.push(eq(s.materialRequests.requestedById, opts.requestedById));
  if (opts.projectId) where.push(eq(s.materialRequests.projectId, opts.projectId));
  const rows = await d
    .select({
      id: s.materialRequests.id,
      number: s.materialRequests.number,
      kind: s.materialRequests.kind,
      status: s.materialRequests.status,
      neededAt: s.materialRequests.neededAt,
      createdAt: s.materialRequests.createdAt,
      projectId: s.projects.id,
      projectName: s.projects.name,
      requester: s.users.fullName,
      lines: sql<number>`(select count(*)::int from request_lines rl where rl.request_id = ${s.materialRequests.id})`,
      unmatched: sql<number>`(select count(*)::int from request_lines rl where rl.request_id = ${s.materialRequests.id} and rl.material_id is null)`,
    })
    .from(s.materialRequests)
    .innerJoin(s.projects, eq(s.projects.id, s.materialRequests.projectId))
    .innerJoin(s.users, eq(s.users.id, s.materialRequests.requestedById))
    .where(and(...where))
    .orderBy(desc(s.materialRequests.createdAt));
  return rows;
}

export async function getRequest(companyId: string, id: string) {
  const d = requireDb();
  const [req] = await d
    .select({
      id: s.materialRequests.id,
      number: s.materialRequests.number,
      kind: s.materialRequests.kind,
      status: s.materialRequests.status,
      note: s.materialRequests.note,
      neededAt: s.materialRequests.neededAt,
      createdAt: s.materialRequests.createdAt,
      projectId: s.projects.id,
      projectName: s.projects.name,
      requester: s.users.fullName,
      requestedById: s.materialRequests.requestedById,
    })
    .from(s.materialRequests)
    .innerJoin(s.projects, eq(s.projects.id, s.materialRequests.projectId))
    .innerJoin(s.users, eq(s.users.id, s.materialRequests.requestedById))
    .where(and(eq(s.materialRequests.companyId, companyId), eq(s.materialRequests.id, id)));
  if (!req) return null;
  const lines = await d
    .select({
      id: s.requestLines.id,
      materialId: s.requestLines.materialId,
      freeText: s.requestLines.freeText,
      qtyRequested: s.requestLines.qtyRequested,
      qtyDelivered: s.requestLines.qtyDelivered,
      name: s.materials.name,
      unit: s.materials.unit,
    })
    .from(s.requestLines)
    .leftJoin(s.materials, eq(s.materials.id, s.requestLines.materialId))
    .where(eq(s.requestLines.requestId, id))
    .orderBy(asc(s.requestLines.id));
  const warehouse = await getWarehouseId(companyId);
  const ids = lines.map((l) => l.materialId).filter((x): x is string => !!x);
  const stock = warehouse && ids.length ? await getStock(warehouse, ids) : new Map<string, number>();
  return {
    ...req,
    lines: lines.map((l) => {
      const requested = Number(l.qtyRequested);
      const delivered = Number(l.qtyDelivered);
      const pending = Math.max(0, requested - delivered);
      const available = l.materialId ? (stock.get(l.materialId) ?? 0) : 0;
      const state: LineState = !l.materialId
        ? "unmatched"
        : pending === 0
          ? "delivered"
          : available >= pending
            ? "available"
            : available > 0
              ? "partial"
              : "missing";
      return { ...l, requested, delivered, pending, available, state };
    }),
  };
}

export type LineState = "unmatched" | "available" | "partial" | "missing" | "delivered";
