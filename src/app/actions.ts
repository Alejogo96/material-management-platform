"use server";

import { and, eq, max } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { schema as s } from "@/db";
import { getCurrentUser, setCurrentUser, clearCurrentUser, homeFor, type CurrentUser, type Role } from "@/lib/session";
import { getRequest, getWarehouseId, requireDb } from "@/lib/data";

async function needUser(roles?: Role[]): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/entrar");
  if (roles && !u.roles.some((r) => roles.includes(r))) throw new Error("No tienes permiso para esta acción.");
  return u;
}

const BODEGA: Role[] = ["warehouse", "owner"];

// ── Sesión demo ─────────────────────────────────────────────────────────
export async function chooseUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const d = requireDb();
  const [u] = await d.select({ id: s.users.id }).from(s.users).where(eq(s.users.id, id));
  if (!u) redirect("/entrar");
  await setCurrentUser(u.id);
  const roles = await d.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, u.id));
  redirect(homeFor(roles.map((r) => r.role)));
}

export async function logout() {
  await clearCurrentUser();
  redirect("/entrar");
}

// ── Crear pedido (celular) ──────────────────────────────────────────────
export type NewRequestInput = {
  projectId: string;
  kind: "daily" | "urgent" | "estimate";
  neededAt: string | null; // ISO
  note: string;
  lines: { materialId: string | null; freeText: string | null; qty: number }[];
};

export async function createRequest(input: NewRequestInput): Promise<{ error?: string; id?: string }> {
  const u = await needUser();
  const d = requireDb();
  const lines = input.lines.filter((l) => l.qty > 0 && (l.materialId || l.freeText?.trim()));
  if (!lines.length) return { error: "Agrega al menos un material." };
  if (!["daily", "urgent", "estimate"].includes(input.kind)) return { error: "Tipo de pedido no válido." };
  const [project] = await d
    .select({ id: s.projects.id })
    .from(s.projects)
    .where(and(eq(s.projects.id, input.projectId), eq(s.projects.companyId, u.companyId)));
  if (!project) return { error: "Elige un proyecto." };

  const id = await d.transaction(async (tx) => {
    const [{ n }] = await tx
      .select({ n: max(s.materialRequests.number) })
      .from(s.materialRequests)
      .where(eq(s.materialRequests.companyId, u.companyId));
    const [req] = await tx
      .insert(s.materialRequests)
      .values({
        companyId: u.companyId,
        number: (n ?? 1000) + 1,
        projectId: project.id,
        kind: input.kind,
        status: "sent",
        requestedById: u.id,
        neededAt: input.neededAt ? new Date(input.neededAt) : null,
        note: input.note.trim() || null,
      })
      .returning({ id: s.materialRequests.id });
    await tx.insert(s.requestLines).values(
      lines.map((l) => ({
        requestId: req.id,
        materialId: l.materialId,
        freeText: l.materialId ? null : l.freeText!.trim(),
        qtyRequested: String(l.qty),
      })),
    );
    return req.id;
  });
  revalidatePath("/campo");
  revalidatePath("/bodega");
  return { id };
}

// ── Bodega: cambiar estado ──────────────────────────────────────────────
export async function markPreparing(formData: FormData) {
  await setStatus(String(formData.get("id")), "preparing");
}
export async function markReady(formData: FormData) {
  await setStatus(String(formData.get("id")), "ready");
}

async function setStatus(id: string, status: "preparing" | "ready") {
  const u = await needUser(BODEGA);
  const d = requireDb();
  await d
    .update(s.materialRequests)
    .set({ status })
    .where(and(eq(s.materialRequests.id, id), eq(s.materialRequests.companyId, u.companyId)));
  revalidatePath(`/bodega/pedido/${id}`);
  revalidatePath("/bodega");
  revalidatePath("/campo");
}

/**
 * Entrega: por cada línea conciliada sale de bodega lo que haya (hasta lo pendiente)
 * como movimiento "issue" al proyecto. Lo que falte queda como faltante para compras.
 */
async function deliver(u: CurrentUser, id: string) {
  const d = requireDb();
  const req = await getRequest(u.companyId, id);
  if (!req) throw new Error("Pedido no encontrado.");
  const warehouse = await getWarehouseId(u.companyId);
  if (!warehouse) throw new Error("No hay bodega configurada.");

  await d.transaction(async (tx) => {
    let anyPending = false;
    for (const l of req.lines) {
      if (!l.materialId || l.pending === 0) {
        if (!l.materialId) anyPending = true;
        continue;
      }
      const qty = Math.min(l.pending, l.available);
      if (qty > 0) {
        const [mat] = await tx.select({ avgCost: s.materials.avgCost }).from(s.materials).where(eq(s.materials.id, l.materialId));
        await tx.insert(s.movements).values({
          companyId: u.companyId,
          kind: "issue",
          materialId: l.materialId,
          qty: String(qty),
          fromLocationId: warehouse,
          projectId: req.projectId,
          requestLineId: l.id,
          unitCost: mat?.avgCost ?? null,
          userId: u.id,
          note: `Pedido #${req.number}`,
        });
        await tx
          .update(s.requestLines)
          .set({ qtyDelivered: String(l.delivered + qty) })
          .where(eq(s.requestLines.id, l.id));
      }
      const missing = l.pending - qty;
      if (missing > 0) {
        anyPending = true;
        await tx.insert(s.purchaseRequests).values({
          companyId: u.companyId,
          materialId: l.materialId,
          qty: String(missing),
          projectIds: [req.projectId],
        });
      }
    }
    await tx
      .update(s.materialRequests)
      .set({ status: anyPending ? "partial" : "delivered" })
      .where(eq(s.materialRequests.id, id));
  });
  revalidatePath(`/bodega/pedido/${id}`);
  revalidatePath("/bodega");
  revalidatePath("/campo");
}

export async function deliverFromWarehouse(formData: FormData) {
  const u = await needUser(BODEGA);
  await deliver(u, String(formData.get("id")));
}

/** El líder confirma con un toque que recogió el pedido. */
export async function confirmReceived(formData: FormData) {
  const u = await needUser();
  const id = String(formData.get("id"));
  const req = await getRequest(u.companyId, id);
  if (!req || req.requestedById !== u.id) throw new Error("Solo quien pidió puede confirmar.");
  if (req.status !== "ready") throw new Error("El pedido todavía no está listo.");
  await deliver(u, id);
}

/** Jimmy concilia un texto libre con un material; el texto se guarda como alias. */
export async function matchLine(formData: FormData) {
  const u = await needUser(BODEGA);
  const d = requireDb();
  const lineId = String(formData.get("lineId"));
  const materialId = String(formData.get("materialId"));
  const requestId = String(formData.get("requestId"));
  const req = await getRequest(u.companyId, requestId);
  const line = req?.lines.find((l) => l.id === lineId);
  if (!req || !line || line.materialId) throw new Error("Línea no encontrada.");
  const [mat] = await d
    .select({ id: s.materials.id })
    .from(s.materials)
    .where(and(eq(s.materials.id, materialId), eq(s.materials.companyId, u.companyId)));
  if (!mat) throw new Error("Material no encontrado.");
  await d.transaction(async (tx) => {
    await tx.update(s.requestLines).set({ materialId: mat.id }).where(eq(s.requestLines.id, lineId));
    if (line.freeText)
      await tx.insert(s.materialAliases).values({ materialId: mat.id, alias: line.freeText.toLowerCase(), source: "learned" });
  });
  revalidatePath(`/bodega/pedido/${requestId}`);
}
