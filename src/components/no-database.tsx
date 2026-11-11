import Link from "next/link";
import { Logo, btn } from "@/components/ui";
import { getLocale, tr } from "@/lib/i18n";

export async function NoDatabase() {
  const t = tr(await getLocale());
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16">
      <Logo />
      <h1 className="text-2xl font-bold">{t("The database isn't connected", "Falta conectar la base de datos")}</h1>
      <p className="text-ink-muted">
        {t("This part needs Supabase. Add the", "Esta parte necesita Supabase. Agrega la variable")} <code>DATABASE_URL</code>{" "}
        {t("variable in Vercel (or in .env.local) and redeploy.", "en Vercel (o en .env.local) y vuelve a desplegar.")}
      </p>
      <Link href="/catalogo" className={btn.secondary}>
        {t("Meanwhile, try the slang catalog search", "Mientras tanto, probar el catálogo con jerga")}
      </Link>
    </main>
  );
}
