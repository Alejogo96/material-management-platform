import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { tr } from "@/lib/i18n";
import { AppShell } from "@/components/app-shell";
import { btn } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";
import { logout, setLanguage } from "../actions";

export const dynamic = "force-dynamic";

export default async function Ajustes() {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  return (
    <AppShell user={user} active="settings">
      <h1 className="mb-6 text-3xl font-bold">{t("Settings", "Ajustes")}</h1>
      <div className="flex max-w-xl flex-col gap-5">
        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold">{t("Language", "Idioma")}</h2>
          <div className="flex gap-2" role="group" aria-label={t("Language", "Idioma")}>
            {(["en", "es"] as const).map((l) => (
              <form key={l} action={setLanguage} className="flex-1">
                <input type="hidden" name="locale" value={l} />
                <button
                  aria-pressed={user.locale === l}
                  className={`h-12 w-full rounded-md border font-heading font-semibold ${
                    user.locale === l ? "border-andy-red bg-andy-red text-white" : "border-border-strong bg-surface hover:bg-subtle"
                  }`}
                >
                  {l === "en" ? "English (US)" : "Español"}
                </button>
              </form>
            ))}
          </div>
          <p className="text-xs text-ink-muted">{t("Saved on your account, so it follows you on any phone or computer.", "Se guarda en tu cuenta, así te sigue en cualquier celular o computador.")}</p>
        </section>

        <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold">{t("Formats", "Formatos")}</h2>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-ink-muted">{t("Dates", "Fechas")}</dt><dd>MM/DD/YYYY</dd>
            <dt className="text-ink-muted">{t("Currency", "Moneda")}</dt><dd>USD ($)</dd>
            <dt className="text-ink-muted">{t("Units", "Unidades")}</dt><dd>ft / in</dd>
            <dt className="text-ink-muted">{t("Time zone", "Zona horaria")}</dt><dd>America/New_York</dd>
          </dl>
        </section>

        <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold">{t("Account", "Cuenta")}</h2>
          <p className="text-sm text-ink-muted">{user.fullName}{user.isAdmin ? ` · ${t("Administrator", "Administrador")}` : ""}</p>
          {user.isAdmin ? (
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/usuarios" className={btn.small}>{t("People & teams", "Personas y equipos")}</Link>
              <Link href="/admin/limites" className={btn.small}>{t("Limits", "Límites")}</Link>
            </div>
          ) : (
            <p className="text-xs text-ink-muted">{t("Admin settings are managed by Andrés, Miguel, Jimmy and Karina.", "Los ajustes de administración los manejan Andrés, Miguel, Jimmy y Karina.")}</p>
          )}
          <form action={logout}>
            <button className={`${btn.secondary} mt-1 w-full`}>{t("Sign out", "Salir")}</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
