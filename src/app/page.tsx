import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { getCurrentUser, homeFor } from "@/lib/session";
import { getLocale, tr } from "@/lib/i18n";
import { Logo, btn } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";
import { chooseUser, setGuestLanguage } from "./actions";

export const dynamic = "force-dynamic";

const ORDER = ["owner", "manager", "warehouse", "purchasing", "van_leader"] as const;

export default async function Home() {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  const locale = user?.locale ?? (await getLocale());
  const t = tr(locale);

  const roleName: Record<string, string> = {
    owner: t("Owners", "Dueños"),
    manager: t("Managers", "Managers"),
    warehouse: t("Warehouse", "Bodega"),
    purchasing: t("Purchasing / office", "Compras / oficina"),
    van_leader: t("Van leaders", "Líderes de van"),
  };
  const roleOne: Record<string, string> = {
    owner: t("Owner", "Dueño"),
    manager: "Manager",
    warehouse: t("Warehouse", "Bodega"),
    purchasing: t("Purchasing", "Compras"),
    van_leader: t("Van leader", "Líder de van"),
  };

  const rows = await db
    .select({ id: s.users.id, name: s.users.fullName, admin: s.users.isAdmin, role: s.userRoles.role })
    .from(s.users)
    .innerJoin(s.userRoles, eq(s.userRoles.userId, s.users.id))
    .where(eq(s.users.active, true))
    .orderBy(asc(s.users.fullName));
  const people = new Map<string, { name: string; admin: boolean; roles: string[] }>();
  for (const r of rows) {
    const p = people.get(r.id) ?? { name: r.name, admin: r.admin, roles: [] };
    p.roles.push(r.role);
    people.set(r.id, p);
  }
  const all = [...people].map(([id, p]) => ({ id, ...p, main: ORDER.find((r) => p.roles.includes(r))! }));
  const admins = all.filter((p) => p.admin);
  const groups = ORDER.map((r) => ({ role: r, list: all.filter((p) => !p.admin && p.main === r) })).filter((g) => g.list.length);

  const PersonButton = ({ id, name, label }: { id: string; name: string; label: string }) => (
    <li className="border-b border-border last:border-b-0">
      <form action={chooseUser}>
        <input type="hidden" name="userId" value={id} />
        <button className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-subtle">
          <span className="font-semibold">{name}</span>
          <span className="text-xs text-ink-muted">{label}</span>
        </button>
      </form>
    </li>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-andy-black px-5 pt-10 pb-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Logo dark tagline={t("Material management", "Gestión de material")} />
          <form action={setGuestLanguage} className="flex gap-1 text-xs">
            {(["en", "es"] as const).map((l) => (
              <button key={l} name="locale" value={l} aria-pressed={locale === l} className={`rounded px-2 py-1 font-semibold ${locale === l ? "bg-white text-andy-black" : "text-white/80"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t("Every material, tied to its project.", "Cada material, ligado a su proyecto.")}</h1>
          <p className="text-ink-muted">{t("Try the beta: pick your profile to see the app as that person.", "Prueba la beta: elige tu perfil para ver la app como esa persona.")}</p>
        </section>

        {user ? (
          <Link href={homeFor(user.roles)} className={btn.accent}>
            {t("Open the app", "Abrir la app")} · {user.fullName}
          </Link>
        ) : (
          <>
            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{t("Administrators", "Administradores")}</h2>
              <ul className="overflow-hidden rounded-lg border border-border bg-surface">
                {admins.map((p) => (
                  <PersonButton key={p.id} id={p.id} name={p.name} label={`${roleOne[p.main]} · Admin`} />
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{t("Other users, by role", "Otros usuarios, por rol")}</h2>
              {groups.map((g, i) => (
                <details key={g.role} open={i === 0} className="overflow-hidden rounded-lg border border-border bg-surface">
                  <summary className="cursor-pointer px-4 py-3.5 font-heading font-semibold">
                    {roleName[g.role]} <span className="font-sans text-xs font-normal text-ink-muted">({g.list.length})</span>
                  </summary>
                  <ul className="border-t border-border">
                    {g.list.map((p) => (
                      <PersonButton key={p.id} id={p.id} name={p.name} label={roleOne[g.role]} />
                    ))}
                  </ul>
                </details>
              ))}
            </section>

            <p className="text-center text-sm text-ink-muted">
              {t("Have an email and password?", "¿Tienes correo y contraseña?")}{" "}
              <Link href="/entrar" className="font-semibold text-andy-red">
                {t("Sign in", "Entrar")}
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}
