/**
 * Aplica solos los archivos supabase/*-update.sql a la base, una sola vez cada uno.
 * Corre antes de cada build en Vercel, así nadie tiene que pegar SQL a mano.
 *
 * - Lleva la cuenta en la tabla app_updates.
 * - Si el archivo ya se había pegado a mano (error "ya existe"), solo lo marca como aplicado.
 * - Nunca rompe el despliegue: si algo falla lo cuenta y sigue.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const ALREADY = new Set(["42710", "42P07", "42701", "42P06"]); // type/table/column/schema ya existe

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[db] Sin DATABASE_URL: se omiten las actualizaciones de base de datos.");
    return;
  }
  const sql = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  try {
    await sql`create table if not exists app_updates (name text primary key, applied_at timestamptz not null default now())`;
    const done = new Set((await sql<{ name: string }[]>`select name from app_updates`).map((r) => r.name));
    const dir = join(process.cwd(), "supabase");
    const files = readdirSync(dir).filter((f) => f.endsWith("-update.sql")).sort();
    for (const f of files) {
      if (done.has(f)) continue;
      const text = readFileSync(join(dir, f), "utf8");
      try {
        await sql.begin(async (tx) => {
          await tx.unsafe(text).simple();
          await tx`insert into app_updates (name) values (${f})`;
        });
        console.log(`[db] Aplicado ${f}`);
      } catch (e) {
        const code = (e as { code?: string }).code;
        if (code && ALREADY.has(code)) {
          await sql`insert into app_updates (name) values (${f}) on conflict do nothing`;
          console.log(`[db] ${f} ya estaba aplicado; se marca como hecho.`);
        } else {
          console.error(`[db] No se pudo aplicar ${f}:`, (e as Error).message);
        }
      }
    }
  } finally {
    await sql.end();
  }
}

main().catch((e) => console.error("[db] Error en actualizaciones:", e.message));
