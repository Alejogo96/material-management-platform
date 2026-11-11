import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, schema as s } from "@/db";

import { tr, type Locale, type Tr } from "./tr";
export { tr };
export type { Locale, Tr };
export const LANG_COOKIE = "lang";

/** Idioma de la cuenta; si no hay sesión, el de la cookie; por defecto inglés. */
export async function getLocale(userId?: string | null): Promise<Locale> {
  const jar = await cookies();
  const c = jar.get(LANG_COOKIE)?.value;
  if (c === "en" || c === "es") return c;
  if (userId && db) {
    const [u] = await db.select({ locale: s.users.locale }).from(s.users).where(eq(s.users.id, userId));
    if (u?.locale === "es") return "es";
  }
  return "en";
}

export function dateFmt(locale: Locale, d: Date | null, withTime = true) {
  if (!d) return "—";
  // Formato fijo MM/DD/YYYY y hora del este de EE. UU.
  const date = new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "America/New_York" }).format(d);
  if (!withTime) return date;
  const time = new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(d);
  return `${date} ${time}`;
}

export const usd = (n: number | string | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(n ?? 0));
