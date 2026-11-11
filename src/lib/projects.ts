import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { schema as s } from "@/db";
import { requireDb, type Tone } from "@/lib/data";
import type { Tr } from "@/lib/i18n";

type Tx = Parameters<Parameters<ReturnType<typeof requireDb>["transaction"]>[0]>[0];

export const PROJECT_TYPES = ["rough_in", "trim", "both", "service_call", "other"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const typeLabel = (t: Tr, ty: string, other?: string | null) =>
  ({
    rough_in: t("Roof / rough-in", "Roof / rough-in"),
    trim: "Trim",
    both: t("Both (rough-in + trim)", "Ambos (rough-in + trim)"),
    service_call: "Service call",
    other: other ? `${t("Other", "Otro")}: ${other}` : t("Other", "Otro"),
  })[ty] ?? ty;

export const statusInfo = (t: Tr, st: string): { label: string; tone: Tone } =>
  ({
    estimating: { label: t("Estimating", "Estimando"), tone: "info" as Tone },
    active: { label: t("Active", "Activo"), tone: "success" as Tone },
    paused: { label: t("Paused", "En pausa"), tone: "warning" as Tone },
    closed: { label: t("Closed", "Cerrado"), tone: "neutral" as Tone },
  })[st] ?? { label: st, tone: "neutral" as Tone };

export const INSPECTION_NAMES = ["Rough-in", "Utility", "Final"] as const;

export async function logEvent(
  tx: Pick<Tx, "insert">,
  projectId: string,
  userId: string | null,
  kind: string,
  detail: string,
) {
  await tx.insert(s.projectEvents).values({ projectId, userId, kind, detail });
}

export async function listProjects(companyId: string) {
  const d = requireDb();
  return d
    .select({
      id: s.projects.id,
      code: s.projects.code,
      name: s.projects.name,
      address: s.projects.address,
      status: s.projects.status,
      type: s.projects.type,
      typeOther: s.projects.typeOther,
      createdAt: s.projects.createdAt,
      lead: s.users.fullName,
      van: s.locations.name,
      orders: sql<number>`(select count(*)::int from material_requests r where r.project_id = ${s.projects.id})`,
      openOrders: sql<number>`(select count(*)::int from material_requests r where r.project_id = ${s.projects.id} and r.status in ('sent','preparing','ready','partial'))`,
      phasesDone: sql<number>`(select count(*)::int from project_phases p where p.project_id = ${s.projects.id} and p.status = 'done')`,
      phasesTotal: sql<number>`(select count(*)::int from project_phases p where p.project_id = ${s.projects.id})`,
    })
    .from(s.projects)
    .leftJoin(s.users, eq(s.users.id, s.projects.managerId))
    .leftJoin(s.locations, eq(s.locations.id, s.projects.vanId))
    .where(eq(s.projects.companyId, companyId))
    .orderBy(desc(s.projects.createdAt));
}

export async function getProject(companyId: string, id: string) {
  const d = requireDb();
  const [p] = await d
    .select({
      p: s.projects,
      lead: sql<string | null>`(select full_name from users where id = ${s.projects.managerId})`,
      creator: sql<string | null>`(select full_name from users where id = ${s.projects.createdById})`,
      van: sql<string | null>`(select name from locations where id = ${s.projects.vanId})`,
    })
    .from(s.projects)
    .where(and(eq(s.projects.companyId, companyId), eq(s.projects.id, id)));
  if (!p) return null;
  const [phases, inspections, events] = await Promise.all([
    d.select().from(s.projectPhases).where(eq(s.projectPhases.projectId, id)).orderBy(asc(s.projectPhases.position)),
    d
      .select()
      .from(s.projectInspections)
      .where(eq(s.projectInspections.projectId, id))
      .orderBy(asc(s.projectInspections.dueDate), asc(s.projectInspections.name)),
    d
      .select({
        id: s.projectEvents.id,
        kind: s.projectEvents.kind,
        detail: s.projectEvents.detail,
        createdAt: s.projectEvents.createdAt,
        user: s.users.fullName,
      })
      .from(s.projectEvents)
      .leftJoin(s.users, eq(s.users.id, s.projectEvents.userId))
      .where(eq(s.projectEvents.projectId, id))
      .orderBy(desc(s.projectEvents.createdAt)),
  ]);
  const [cost] = await d.execute<{ estimated: string | null; issued: string | null }>(sql`
    select
      (select sum(qty * coalesce(unit_cost, 0)) from project_estimates where project_id = ${id}) as estimated,
      (select sum(qty * coalesce(unit_cost, 0)) from movements where project_id = ${id} and kind = 'issue') as issued
  `);
  return {
    ...p.p,
    leadName: p.lead,
    creatorName: p.creator,
    vanName: p.van,
    phases,
    inspections,
    events,
    estimated: Number(cost?.estimated ?? 0),
    issued: Number(cost?.issued ?? 0),
  };
}

/** Personas que pueden ser encargado de un proyecto. */
export async function listPeople(companyId: string) {
  const d = requireDb();
  return d
    .select({ id: s.users.id, name: s.users.fullName })
    .from(s.users)
    .where(and(eq(s.users.companyId, companyId), eq(s.users.active, true)))
    .orderBy(asc(s.users.fullName));
}

export async function listVans(companyId: string) {
  const d = requireDb();
  return d
    .select({ id: s.locations.id, name: s.locations.name })
    .from(s.locations)
    .where(and(eq(s.locations.companyId, companyId), eq(s.locations.kind, "van")))
    .orderBy(asc(s.locations.name));
}

export async function getSettings(companyId: string) {
  const d = requireDb();
  const [row] = await d.select().from(s.companySettings).where(eq(s.companySettings.companyId, companyId));
  return {
    approvalThreshold: Number(row?.approvalThreshold ?? 500),
    excessPct: row?.excessPct ?? 10,
    reminderHours: row?.reminderHours ?? 2,
  };
}


export const phaseStatusLabel = (t: Tr, st: string) =>
  ({ pending: t("Pending", "Pendiente"), in_progress: t("In progress", "En curso"), done: t("Done", "Listo") })[st] ?? st;
export const inspectionLabel = (t: Tr, st: string): { label: string; tone: Tone } =>
  ({
    pending: { label: t("Pending", "Pendiente"), tone: "neutral" as Tone },
    passed: { label: t("Passed", "Aprobada"), tone: "success" as Tone },
    failed: { label: t("Failed", "Reprobada"), tone: "danger" as Tone },
  })[st] ?? { label: st, tone: "neutral" as Tone };

/** Texto legible de un evento del histórico, en el idioma de quien lo ve. */
export function eventText(t: Tr, kind: string, detail: string) {
  const [a, b] = detail.split("|");
  switch (kind) {
    case "created":
      return t("Project created", "Proyecto creado");
    case "status":
      return t(`Status changed to ${statusInfo(t, a).label}`, `Estado cambiado a ${statusInfo(t, a).label}`);
    case "lead":
      return t(`Lead changed to ${a}`, `Encargado cambiado a ${a}`);
    case "van":
      return t(`Team assigned: ${a}`, `Equipo asignado: ${a}`);
    case "phase":
      return t(`Phase “${a}”: ${phaseStatusLabel(t, b)}`, `Fase “${a}”: ${phaseStatusLabel(t, b)}`);
    case "inspection":
      return t(`Inspection “${a}”: ${inspectionLabel(t, b).label}`, `Revisión “${a}”: ${inspectionLabel(t, b).label}`);
    case "request":
      return t(`Order #${a} sent (${b} lines)`, `Pedido #${a} enviado (${b} líneas)`);
    case "delivery":
      return b === "partial"
        ? t(`Order #${a} delivered partially — missing items sent to purchasing`, `Pedido #${a} entregado parcialmente — lo que falta pasó a compras`)
        : t(`Order #${a} delivered`, `Pedido #${a} entregado`);
    default:
      return detail;
  }
}
