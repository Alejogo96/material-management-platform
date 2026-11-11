import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

/**
 * Sesión: la cookie guarda el id de la persona firmado con HMAC (no se puede inventar).
 * Se entra con correo y contraseña, o con el selector de demo (para mostrar la app).
 * Antes de usar datos reales se reemplaza por Supabase Auth (código por SMS o email).
 */
const COOKIE = "demo_user";
const secret = () => process.env.SESSION_SECRET || process.env.DATABASE_URL || "dev-secret";
const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("hex");

export type Role = (typeof s.roleEnum.enumValues)[number];
export type CurrentUser = {
  id: string;
  fullName: string;
  companyId: string;
  roles: Role[];
  locale: "en" | "es";
  isAdmin: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!db) return null;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(sign(id), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [u] = await db.select().from(s.users).where(eq(s.users.id, id));
  if (!u || !u.active) return null;
  const roles = await db.select({ role: s.userRoles.role }).from(s.userRoles).where(eq(s.userRoles.userId, id));
  return {
    id: u.id,
    fullName: u.fullName,
    companyId: u.companyId,
    roles: roles.map((r) => r.role),
    locale: u.locale === "es" ? "es" : "en",
    isAdmin: u.isAdmin,
  };
}

export async function setCurrentUser(id: string) {
  (await cookies()).set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCurrentUser() {
  (await cookies()).delete(COOKIE);
}

/** Quién puede crear proyectos: Jimmy (bodega), managers y dueños. Los demás piden que se lo creen. */
export const canCreateProject = (u: CurrentUser) => u.roles.some((r) => ["owner", "manager", "warehouse"].includes(r));
/** Ven costos y presupuestos: todos menos los líderes de van. */
export const canSeeCosts = (u: CurrentUser) => u.roles.some((r) => r !== "van_leader");
export const isFieldOnly = (u: CurrentUser) => u.roles.every((r) => r === "van_leader");

/** Página de inicio que corresponde a cada rol. */
export function homeFor(roles: Role[]): string {
  if (roles.includes("warehouse") || roles.includes("purchasing")) return "/bodega";
  if (roles.includes("owner") || roles.includes("manager")) return "/proyectos";
  return "/campo";
}

/** Compras: Clara y Karina (compras), Miguel y Andrés (dueños). Bodega y managers solo ven. */
export const canSeePurchasing = (u: CurrentUser) => u.roles.some((r) => ["owner", "purchasing", "warehouse", "manager"].includes(r));
export const canBuy = (u: CurrentUser) => u.roles.some((r) => ["owner", "purchasing"].includes(r));
/** Aprueban compras grandes: los dueños (Miguel, Andrés) y Karina (compras con acceso de administrador). */
export const canApprovePurchases = (u: CurrentUser) => u.roles.includes("owner") || (u.roles.includes("purchasing") && u.isAdmin);
export const canReceive = (u: CurrentUser) => u.roles.some((r) => ["owner", "purchasing", "warehouse"].includes(r));
