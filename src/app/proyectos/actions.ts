"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { schema as s } from "@/db";
import { canCreateProject, getCurrentUser } from "@/lib/session";
import { requireDb } from "@/lib/data";
import { logEvent, PROJECT_TYPES, type ProjectType } from "@/lib/projects";

export type NewProjectInput = {
  name: string;
  address: string;
  clientName: string;
  leadId: string;
  vanId: string;
  type: ProjectType;
  typeOther: string;
  materialBudget: string;
  phases: { name: string; spec: string }[];
  inspections: { name: string; dueDate: string }[];
};

async function needManager() {
  const u = await getCurrentUser();
  if (!u) redirect("/entrar");
  if (!canCreateProject(u)) throw new Error("No permission.");
  return u;
}

export async function createProject(input: NewProjectInput): Promise<{ error?: string }> {
  const u = await needManager();
  const d = requireDb();
  const name = input.name.trim();
  const address = input.address.trim();
  if (!name) return { error: "name" };
  if (!address) return { error: "address" };
  if (!PROJECT_TYPES.includes(input.type)) return { error: "type" };
  if (input.type === "other" && !input.typeOther.trim()) return { error: "typeOther" };
  const phases = input.phases.filter((p) => p.name.trim());
  const inspections = input.inspections.filter((i) => i.name.trim());
  const budget = input.materialBudget.trim() ? Number(input.materialBudget) : null;
  if (budget !== null && (!Number.isFinite(budget) || budget < 0)) return { error: "budget" };

  const id = await d.transaction(async (tx) => {
    const [{ n }] = await tx
      .select({ n: sql<number>`coalesce(max(nullif(regexp_replace(${s.projects.code}, '\\D', '', 'g'), '')::int), 0)::int` })
      .from(s.projects)
      .where(eq(s.projects.companyId, u.companyId));
    const isSC = input.type === "service_call";
    const code = `${isSC ? "SC" : "P"}-${String(n + 1).padStart(3, "0")}`;
    const [p] = await tx
      .insert(s.projects)
      .values({
        companyId: u.companyId,
        code,
        name,
        address,
        clientName: input.clientName.trim() || null,
        kind: isSC ? "service_call" : "project",
        status: isSC ? "active" : "estimating",
        type: input.type,
        typeOther: input.type === "other" ? input.typeOther.trim() : null,
        managerId: input.leadId || null,
        vanId: input.vanId || null,
        materialBudget: budget === null ? null : String(budget),
        createdById: u.id,
      })
      .returning({ id: s.projects.id });
    if (phases.length)
      await tx
        .insert(s.projectPhases)
        .values(phases.map((ph, i) => ({ projectId: p.id, position: i, name: ph.name.trim(), spec: ph.spec.trim() || null })));
    if (inspections.length)
      await tx.insert(s.projectInspections).values(
        inspections.map((i) => ({ projectId: p.id, name: i.name.trim(), dueDate: i.dueDate || null })),
      );
    await logEvent(tx, p.id, u.id, "created", "");
    return p.id;
  });
  revalidatePath("/proyectos");
  redirect(`/proyectos/${id}`);
}

async function ownProject(companyId: string, id: string) {
  const d = requireDb();
  const [p] = await d
    .select({ id: s.projects.id })
    .from(s.projects)
    .where(and(eq(s.projects.id, id), eq(s.projects.companyId, companyId)));
  if (!p) throw new Error("Project not found.");
  return d;
}

export async function setProjectStatus(formData: FormData) {
  const u = await needManager();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["estimating", "active", "paused", "closed"].includes(status)) return;
  const d = await ownProject(u.companyId, id);
  await d.transaction(async (tx) => {
    await tx
      .update(s.projects)
      .set({ status: status as "active", closedAt: status === "closed" ? new Date() : null })
      .where(eq(s.projects.id, id));
    await logEvent(tx, id, u.id, "status", status);
  });
  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
}

export async function setProjectLead(formData: FormData) {
  const u = await needManager();
  const id = String(formData.get("id"));
  const leadId = String(formData.get("leadId"));
  const d = await ownProject(u.companyId, id);
  const [person] = await d
    .select({ name: s.users.fullName })
    .from(s.users)
    .where(and(eq(s.users.id, leadId), eq(s.users.companyId, u.companyId)));
  if (!person) return;
  await d.transaction(async (tx) => {
    await tx.update(s.projects).set({ managerId: leadId }).where(eq(s.projects.id, id));
    await logEvent(tx, id, u.id, "lead", person.name);
  });
  revalidatePath(`/proyectos/${id}`);
}

export async function setProjectVan(formData: FormData) {
  const u = await needManager();
  const id = String(formData.get("id"));
  const vanId = String(formData.get("vanId"));
  const d = await ownProject(u.companyId, id);
  const [van] = await d
    .select({ name: s.locations.name })
    .from(s.locations)
    .where(and(eq(s.locations.id, vanId), eq(s.locations.companyId, u.companyId), eq(s.locations.kind, "van")));
  if (!van) return;
  await d.transaction(async (tx) => {
    await tx.update(s.projects).set({ vanId }).where(eq(s.projects.id, id));
    await logEvent(tx, id, u.id, "van", van.name);
  });
  revalidatePath(`/proyectos/${id}`);
}

export async function setPhaseStatus(formData: FormData) {
  const u = await needManager();
  const id = String(formData.get("id"));
  const phaseId = String(formData.get("phaseId"));
  const status = String(formData.get("status"));
  if (!["pending", "in_progress", "done"].includes(status)) return;
  const d = await ownProject(u.companyId, id);
  const [ph] = await d
    .select({ name: s.projectPhases.name })
    .from(s.projectPhases)
    .where(and(eq(s.projectPhases.id, phaseId), eq(s.projectPhases.projectId, id)));
  if (!ph) return;
  await d.transaction(async (tx) => {
    await tx.update(s.projectPhases).set({ status: status as "done" }).where(eq(s.projectPhases.id, phaseId));
    await logEvent(tx, id, u.id, "phase", `${ph.name}|${status}`);
  });
  revalidatePath(`/proyectos/${id}`);
  revalidatePath("/proyectos");
}

export async function setInspectionStatus(formData: FormData) {
  const u = await needManager();
  const id = String(formData.get("id"));
  const inspectionId = String(formData.get("inspectionId"));
  const status = String(formData.get("status"));
  if (!["pending", "passed", "failed"].includes(status)) return;
  const d = await ownProject(u.companyId, id);
  const [ins] = await d
    .select({ name: s.projectInspections.name })
    .from(s.projectInspections)
    .where(and(eq(s.projectInspections.id, inspectionId), eq(s.projectInspections.projectId, id)));
  if (!ins) return;
  await d.transaction(async (tx) => {
    await tx.update(s.projectInspections).set({ status: status as "passed" }).where(eq(s.projectInspections.id, inspectionId));
    await logEvent(tx, id, u.id, "inspection", `${ins.name}|${status}`);
  });
  revalidatePath(`/proyectos/${id}`);
}
