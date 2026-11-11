"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { schema as s } from "@/db";
import { getCurrentUser, type Role } from "@/lib/session";
import { requireDb } from "@/lib/data";
import { hashPassword } from "@/lib/password";
import { tr } from "@/lib/tr";

const ROLES: Role[] = ["owner", "manager", "van_leader", "warehouse", "purchasing"];

async function needAdmin() {
  const u = await getCurrentUser();
  if (!u) redirect("/entrar");
  if (!u.isAdmin) throw new Error("Admins only.");
  return u;
}

export type FormState = { error?: string } | null;

function parse(formData: FormData) {
  const roles = formData.getAll("roles").map(String).filter((r): r is Role => ROLES.includes(r as Role));
  return {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    teamId: String(formData.get("teamId") ?? "") || null,
    roles,
    isAdmin: formData.get("isAdmin") === "on",
    locale: formData.get("locale") === "es" ? "es" : "en",
  };
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await needAdmin();
  const t = tr(me.locale);
  const d = requireDb();
  const f = parse(formData);
  if (!f.fullName) return { error: t("Add the person's name.", "Escribe el nombre de la persona.") };
  if (!emailOk(f.email)) return { error: t("Enter a valid email.", "Escribe un correo válido.") };
  if (f.password.length < 8) return { error: t("The password needs at least 8 characters.", "La contraseña necesita al menos 8 caracteres.") };
  if (!f.roles.length) return { error: t("Pick at least one role.", "Elige al menos un rol.") };
  const [dup] = await d
    .select({ id: s.users.id })
    .from(s.users)
    .where(and(eq(s.users.companyId, me.companyId), sql`lower(${s.users.email}) = ${f.email}`));
  if (dup) return { error: t("That email already has a profile.", "Ese correo ya tiene un perfil.") };
  const id = await d.transaction(async (tx) => {
    const [u] = await tx
      .insert(s.users)
      .values({
        companyId: me.companyId,
        fullName: f.fullName,
        email: f.email,
        passwordHash: hashPassword(f.password),
        teamId: f.teamId,
        isAdmin: f.isAdmin,
        locale: f.locale,
      })
      .returning({ id: s.users.id });
    await tx.insert(s.userRoles).values(f.roles.map((role) => ({ userId: u.id, role })));
    return u.id;
  });
  revalidatePath("/admin/usuarios");
  redirect(`/admin/usuarios/${id}?creado=1`);
}

export async function updateUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await needAdmin();
  const t = tr(me.locale);
  const d = requireDb();
  const id = String(formData.get("id"));
  const f = parse(formData);
  const active = formData.get("active") === "on";
  if (!f.fullName) return { error: t("Add the person's name.", "Escribe el nombre de la persona.") };
  if (f.email && !emailOk(f.email)) return { error: t("Enter a valid email.", "Escribe un correo válido.") };
  if (!f.roles.length) return { error: t("Pick at least one role.", "Elige al menos un rol.") };
  const [target] = await d.select().from(s.users).where(and(eq(s.users.id, id), eq(s.users.companyId, me.companyId)));
  if (!target) return { error: t("Person not found.", "Persona no encontrada.") };
  if (f.email) {
    const [dup] = await d
      .select({ id: s.users.id })
      .from(s.users)
      .where(and(eq(s.users.companyId, me.companyId), sql`lower(${s.users.email}) = ${f.email}`, ne(s.users.id, id)));
    if (dup) return { error: t("That email already has a profile.", "Ese correo ya tiene un perfil.") };
  }
  if (id === me.id && (!f.isAdmin || !active))
    return { error: t("You can't remove your own admin access or deactivate yourself.", "No puedes quitarte el acceso de administrador ni desactivarte.") };
  await d.transaction(async (tx) => {
    await tx
      .update(s.users)
      .set({ fullName: f.fullName, email: f.email || null, teamId: f.teamId, isAdmin: f.isAdmin, active, locale: f.locale })
      .where(eq(s.users.id, id));
    await tx.delete(s.userRoles).where(eq(s.userRoles.userId, id));
    await tx.insert(s.userRoles).values(f.roles.map((role) => ({ userId: id, role })));
  });
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${id}`);
  return { error: undefined };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await needAdmin();
  const t = tr(me.locale);
  const d = requireDb();
  const id = String(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: t("The password needs at least 8 characters.", "La contraseña necesita al menos 8 caracteres.") };
  const res = await d
    .update(s.users)
    .set({ passwordHash: hashPassword(password) })
    .where(and(eq(s.users.id, id), eq(s.users.companyId, me.companyId)))
    .returning({ id: s.users.id });
  if (!res.length) return { error: t("Person not found.", "Persona no encontrada.") };
  return { error: undefined };
}

export async function saveLimits(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await needAdmin();
  const t = tr(me.locale);
  const d = requireDb();
  const approval = Number(formData.get("approvalThreshold"));
  const excess = Number(formData.get("excessPct"));
  const reminder = Number(formData.get("reminderHours"));
  if (!Number.isFinite(approval) || approval < 0) return { error: t("The approval amount must be 0 or more.", "El monto de aprobación debe ser 0 o más.") };
  if (!Number.isInteger(excess) || excess < 0 || excess > 100) return { error: t("Excess % must be a whole number from 0 to 100.", "El % de exceso debe ser un entero de 0 a 100.") };
  if (!Number.isInteger(reminder) || reminder < 1 || reminder > 72) return { error: t("Reminder hours must be from 1 to 72.", "Las horas de recordatorio deben ser de 1 a 72.") };
  await d
    .insert(s.companySettings)
    .values({ companyId: me.companyId, approvalThreshold: String(approval), excessPct: excess, reminderHours: reminder })
    .onConflictDoUpdate({
      target: s.companySettings.companyId,
      set: { approvalThreshold: String(approval), excessPct: excess, reminderHours: reminder },
    });
  revalidatePath("/admin/limites");
  return { error: undefined };
}
