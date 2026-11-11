import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Logo, NoDatabase } from "@/components/ui";
import { chooseUser } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar · Andy Electric" };

const roleLabel: Record<string, string> = {
  owner: "Dueño",
  manager: "Manager",
  van_leader: "Líder de van",
  warehouse: "Bodega",
  purchasing: "Compras",
};

export default async function EntrarPage() {
  if (!db) return <NoDatabase />;
  const rows = await db
    .select({ id: s.users.id, name: s.users.fullName, role: s.userRoles.role })
    .from(s.users)
    .innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id))
    .orderBy(asc(s.users.fullName));
  const people = new Map<string, { name: string; roles: string[] }>();
  for (const r of rows) {
    const p = people.get(r.id) ?? { name: r.name, roles: [] };
    p.roles.push(roleLabel[r.role]);
    people.set(r.id, p);
  }

  return (
    <div className="min-h-dvh">
      <header className="bg-andy-black px-5 pt-10 pb-6">
        <div className="mx-auto max-w-lg">
          <Logo dark />
        </div>
      </header>
      <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold">¿Quién eres?</h1>
          <p className="text-sm text-ink-muted">
            Modo demo: elige una persona para ver la app como la vería ella. Luego se cambia por un login real.
          </p>
        </div>
        <ul className="overflow-hidden rounded-lg border border-border bg-surface">
          {[...people].map(([id, p]) => (
            <li key={id} className="border-b border-border last:border-b-0">
              <form action={chooseUser}>
                <input type="hidden" name="userId" value={id} />
                <button className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-subtle">
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-xs text-ink-muted">{p.roles.join(" · ")}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
