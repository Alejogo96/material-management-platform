"use server";

import { and, eq, inArray, max, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { schema as s } from "@/db";
import { getCurrentUser, setCurrentUser, clearCurrentUser, homeFor, type CurrentUser, type Role } from "@/lib/session";
import { getRequest, getWarehouseId, requireDb } from "@/lib/data";
import { verifyPassword } from "@/lib/password";
import { logEvent, getSettings } from "@/lib/projects";
import { LANG_COOKIE } from "@/lib/i18n";
import { tr } from "@/lib/tr";

async function needUser(roles?: Role[]): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/entrar");
  if (roles && !u.roles.some((r) => roles.includes(r))) throw new Error("No permission.");
  return u;
}

const BODEGA: Role[] = ["warehouse", "owner"];

// ── Sesión ──────────────────────────────────────────────────────────────
async function startSession(userId: string) {
  const d = requireDb();
  await setCurrentUser(userId);
  const [u] = await d.select({ locale: s.users.locale }).from(s.users).where(eq(s.users.id, userId));
  (await cookies()).set(LANG_COOKIE, u?.locale === "es" ? "es" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const roles = await d.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, userId));
  redirect(homeFor(roles.map((r) => r.role)));
}

/** Entrada de demo: elige una persona del equipo sin contraseña. */
export async function chooseUser(formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const d = requireDb();
  const [u] = await d.select({ id: s.users.id, active: s.users.active }).from(s.users).where(eq(s.users.id, id));
  if (!u || !u.active) redirect("/entrar");
  await startSession(u.id);
}

/** Entrada con correo y contraseña (perfiles creados por los administradores). */
export async function signIn(_prev: { error?: string } | null, formData: FormData): Promise<{ error?: string }> {
  const d = requireDb();
  const lang = (await cookies()).get(LANG_COOKIE)?.value === "es" ? "es" : "en";
  const t = tr(lang);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  // Acceso genérico temporal de la beta: adm / adm entra como administrador (Miguel). Se quita antes de usar datos reales.
  if (email === "adm" && password === "adm") {
    const admins = await d.select().from(s.users).where(and(eq(s.users.isAdmin, true), eq(s.users.active, true)));
    const pick = admins.find((a) => a.fullName.startsWith("Miguel")) ?? admins[0];
    if (pick) await startSession(pick.id);
  }
  const [u] = email ? await d.select().from(s.users).where(sql`lower(${s.users.email}) = ${email}`) : [];
  // Se verifica siempre para que el tiempo de respuesta no revele si el correo existe.
  const ok = verifyPassword(password, u?.passwordHash ?? "00:00");
  if (!u || !u.active || !ok) return { error: t("Wrong email or password.", "Correo o contraseña incorrectos.") };
  await startSession(u.id);
  return {};
}

export async function logout() {
  await clearCurrentUser();
  redirect("/entrar");
}

export async function setLanguage(formData: FormData) {
  const u = await needUser();
  const locale = formData.get("locale") === "es" ? "es" : "en";
  await requireDb().update(s.users).set({ locale }).where(eq(s.users.id, u.id));
  (await cookies()).set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// ── Crear pedido (celular) ──────────────────────────────────────────────
export type NewRequestInput = {
  projectId: string;
  kind: "daily" | "urgent" | "estimate";
  neededAt: string | null; // ISO
  note: string;
  lines: { materialId: string | null; freeText: string | null; qty: number }[];
  /** true = el usuario ya vio las advertencias (duplicado / exceso) y quiere enviar igual. */
  confirm?: boolean;
};

/** Casos a avisar antes de enviar: pedido repetido y exceso sobre el estimado. */
async function orderWarnings(u: CurrentUser, projectId: string, lines: { materialId: string | null; qty: number }[]) {
  const d = requireDb();
  const t = tr(u.locale);
  const ids = [...new Set(lines.map((l) => l.materialId).filter((x): x is string => !!x))];
  const out: string[] = [];
  if (!ids.length) return out;

  const dup = await d
    .select({ number: s.materialRequests.number, name: s.materials.name })
    .from(s.requestLines)
    .innerJoin(s.materialRequests, eq(s.materialRequests.id, s.requestLines.requestId))
    .innerJoin(s.materials, eq(s.materials.id, s.requestLines.materialId))
    .where(
      and(
        eq(s.materialRequests.projectId, projectId),
        inArray(s.materialRequests.status, ["sent", "preparing", "ready"]),
        inArray(s.requestLines.materialId, ids),
      ),
    )
    .limit(3);
  if (dup.length)
    out.push(
      t(
        `Possible duplicate: ${dup.map((x) => x.name).join(", ")} already in open order #${dup[0].number} for this project.`,
        `Posible duplicado: ${dup.map((x) => x.name).join(", ")} ya está en el pedido abierto #${dup[0].number} de este proyecto.`,
      ),
    );

  const { excessPct } = await getSettings(u.companyId);
  const over: string[] = [];
  for (const id of ids) {
    const [est] = await d
      .select({ qty: s.projectEstimates.qty })
      .from(s.projectEstimates)
      .where(and(eq(s.projectEstimates.projectId, projectId), eq(s.projectEstimates.materialId, id)));
    if (!est) continue;
    const [prev] = await d.execute<{ qty: string }>(sql`
      select coalesce(sum(rl.qty_requested), 0) as qty
      from request_lines rl join material_requests r on r.id = rl.request_id
      where r.project_id = ${projectId} and rl.material_id = ${id} and r.status <> 'cancelled'
    `);
    const total = Number(prev?.qty ?? 0) + lines.filter((l) => l.materialId === id).reduce((n, l) => n + l.qty, 0);
    if (total > Number(est.qty) * (1 + excessPct / 100)) {
      const [m] = await d.select({ name: s.materials.name }).from(s.materials).where(eq(s.materials.id, id));
      over.push(`${m?.name ?? "?"} (${total} / ${Number(est.qty)})`);
    }
  }
  if (over.length)
    out.push(
      t(
        `Over the estimate by more than ${excessPct}%: ${over.join(", ")}.`,
        `Por encima del estimado en más de ${excessPct}%: ${over.join(", ")}.`,
      ),
    );
  return out;
}

export async function createRequest(input: NewRequestInput): Promise<{ error?: string; warning?: string; id?: string }> {
  const u = await needUser();
  const t = tr(u.locale);
  const d = requireDb();
  const lines = input.lines.filter((l) => l.qty > 0 && (l.materialId || l.freeText?.trim()));
  if (!lines.length) return { error: t("Add at least one material.", "Agrega al menos un material.") };
  if (!["daily", "urgent", "estimate"].includes(input.kind)) return { error: t("Invalid order type.", "Tipo de pedido no válido.") };
  const [project] = await d
    .select({ id: s.projects.id, status: s.projects.status })
    .from(s.projects)
    .where(and(eq(s.projects.id, input.projectId), eq(s.projects.companyId, u.companyId)));
  if (!project) return { error: t("Pick a project.", "Elige un proyecto.") };
  if (project.status === "closed" || project.status === "paused")
    return { error: t("This project is closed or paused. Ask a manager to reopen it.", "Este proyecto está cerrado o en pausa. Pídele a un manager que lo reabra.") };
  if (!input.confirm) {
    const warnings = await orderWarnings(u, project.id, lines);
    if (warnings.length) return { warning: warnings.join(" ") };
  }

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
    await logEvent(tx, project.id, u.id, "request", `${(n ?? 1000) + 1}|${lines.length}`);
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
    await logEvent(tx, req.projectId, u.id, "delivery", `${req.number}|${anyPending ? "partial" : "delivered"}`);
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

/** Idioma antes de iniciar sesión (solo cookie). */
export async function setGuestLanguage(formData: FormData) {
  const locale = formData.get("locale") === "es" ? "es" : "en";
  (await cookies()).set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
