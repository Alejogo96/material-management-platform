import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/**
 * Sesión de DEMO: la persona elige quién es en /entrar y se guarda en una cookie.
 * Sirve para mostrar la app a Andy Electric. Antes de usarla con datos reales
 * se reemplaza por login de Supabase (código por SMS o email).
 */
const COOKIE = "demo_user";

export type Role = (typeof s.roleEnum.enumValues)[number];
export type CurrentUser = { id: string; fullName: string; companyId: string; roles: Role[] };

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!db) return null;
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
  if (!u) return null;
  const roles = await db.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, id));
  return { id: u.id, fullName: u.fullName, companyId: u.companyId, roles: roles.map((r) => r.role) };
}

export async function setCurrentUser(id: string) {
  (await cookies()).set(COOKIE, id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}

export async function clearCurrentUser() {
  (await cookies()).delete(COOKIE);
}

/** Página de inicio que corresponde a cada rol. */
export function homeFor(roles: Role[]): string {
  if (roles.includes("warehouse") || roles.includes("purchasing") || roles.includes("owner")) return "/bodega";
  return "/campo";
}
