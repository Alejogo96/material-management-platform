/**
 * Búsqueda de materiales tolerante a jerga: compara lo que escribe la persona
 * contra el nombre, el SKU y todos los alias (español, inglés o mezcla).
 *
 * En la base de datos esto se hará con pg_trgm + unaccent; esta versión en
 * memoria sirve para la demo y para probar la lógica sin base de datos.
 */
export type Searchable = { sku: string; name: string; aliases: string[] };

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .replace(/["'”″]/g, "") // 3/4" → 3/4
    .replace(/[^a-z0-9/.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Devuelve el puntaje de coincidencia (0 = no coincide) y qué texto coincidió. */
export function score(item: Searchable, query: string): { score: number; matched: string | null } {
  const q = normalize(query);
  if (!q) return { score: 0, matched: null };
  const tokens = q.split(" ");
  let best = { score: 0, matched: null as string | null };
  for (const candidate of [item.name, item.sku, ...item.aliases]) {
    const c = normalize(candidate);
    let s = 0;
    if (c === q) s = 100;
    else if (c.startsWith(q)) s = 80;
    else if (c.includes(q)) s = 60;
    else if (tokens.every((t) => c.split(/[\s-]/).some((w) => w.startsWith(t) || w === t))) s = 40;
    if (s > best.score) best = { score: s, matched: candidate };
  }
  return best;
}

export function search<T extends Searchable>(items: T[], query: string, limit = 20) {
  return items
    .map((item) => ({ item, ...score(item, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, limit);
}
