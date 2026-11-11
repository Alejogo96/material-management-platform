import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { Logo } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";
import { getLocale, tr } from "@/lib/i18n";
import { chooseUser, setGuestLanguage } from "../actions";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in · Andy Electric" };

export default async function EntrarPage() {
  if (!db) return <NoDatabase />;
  const locale = await getLocale();
  const t = tr(locale);
  const roleLabel: Record<string, string> = {
    owner: t("Owner", "Dueño"),
    manager: "Manager",
    van_leader: t("Van leader", "Líder de van"),
    warehouse: t("Warehouse", "Bodega"),
    purchasing: t("Purchasing", "Compras"),
  };
  const rows = await db
    .select({ id: s.users.id, name: s.users.fullName, role: s.userRoles.role })
    .from(s.users)
    .innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id))
    .where(eq(s.users.active, true))
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
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Logo dark />
          <form action={setGuestLanguage} className="flex gap-1 text-xs">
            {(["en", "es"] as const).map((l) => (
              <button key={l} name="locale" value={l} aria-pressed={locale === l} className={`rounded px-2 py-1 font-semibold ${locale === l ? "bg-white text-andy-black" : "text-white/80"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </form>
        </div>
      </header>
      <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-6">
        <section className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">{t("Sign in", "Entrar")}</h1>
          <SignInForm locale={locale} />
        </section>

        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold">{t("Demo: who are you?", "Demo: ¿quién eres?")}</h2>
            <p className="text-sm text-ink-muted">
              {t("Pick a person to see the app as they would. This shortcut goes away before real data.", "Elige una persona para ver la app como la vería ella. Este atajo se quita antes de usar datos reales.")}
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
        </section>
      </main>
    </div>
  );
}
