import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getLocale, tr } from "@/lib/i18n";

export default async function Home() {
  const user = await getCurrentUser();
  const t = tr(user?.locale ?? (await getLocale()));
  const phases = [
    { name: t("Phase 0 · Base", "Fase 0 · Base"), status: t("Done", "Listo"), items: [t("Next.js app with the Andy brand", "Proyecto Next.js con el brand de Andy"), t("Data model and sample data", "Modelo de datos y datos de ejemplo"), t("Slang-aware catalog search", "Búsqueda de catálogo con jerga")] },
    { name: t("Phase 1 · Demo MVP", "Fase 1 · MVP demostrable"), status: t("Done", "Listo"), items: [t("Orders from the phone ✓", "Pedidos desde el celular ✓"), t("Warehouse inbox ✓", "Bandeja de Jimmy ✓")] },
    { name: t("Beta", "Beta"), status: t("Now", "Ahora"), items: [t("Projects with phases, inspections and history ✓", "Proyectos con fases, revisiones e histórico ✓"), t("Orders by project ✓", "Pedidos por proyecto ✓"), t("Settings, people and admins ✓", "Ajustes, personas y administradores ✓"), t("EN / ES and error screens ✓", "EN / ES y pantallas de error ✓")] },
    { name: t("Next", "Siguiente"), status: t("Later", "Después"), items: [t("Quotes and purchasing", "Cotizaciones y compras"), t("Leftovers and scrap", "Sobrantes y chatarrería"), t("Metrics and real login", "Métricas y login real")] },
  ];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-andy-black px-5 pt-10 pb-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Image src="/andy-mark.svg" alt="" width={20} height={35} priority />
          <div>
            <p className="font-heading text-lg font-bold">Andy Electric</p>
            <p className="text-xs opacity-80">{t("Material management", "Gestión de material")}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t("Every material, tied to its project.", "Cada material, ligado a su proyecto.")}</h1>
          <p className="text-ink-muted">
            {t(
              "Orders from the phone, one inbox for the warehouse, projects with their full history, and shortages ready for purchasing.",
              "Pedidos desde el celular, una sola bandeja para la bodega, proyectos con todo su histórico y faltantes listos para compras.",
            )}
          </p>
        </section>

        <Link
          href={user ? "/proyectos" : "/entrar"}
          className="flex items-center justify-between rounded-lg bg-andy-red px-5 py-4 font-heading font-semibold text-white hover:bg-andy-red-dark"
        >
          {user ? t("Open the app", "Abrir la app") : t("Sign in / try the demo", "Entrar / probar la demo")}
          <span aria-hidden>→</span>
        </Link>
        <Link
          href="/catalogo"
          className="-mt-3 flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 font-heading font-semibold hover:bg-subtle"
        >
          {t("Try the slang catalog search", "Probar la búsqueda de catálogo con jerga")}
          <span aria-hidden>→</span>
        </Link>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((p) => (
            <article key={p.name} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-ink-muted">{p.status}</p>
              <h2 className="mt-1 font-semibold">{p.name}</h2>
              <ul className="mt-2 list-disc pl-4 text-sm text-ink-muted">
                {p.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
