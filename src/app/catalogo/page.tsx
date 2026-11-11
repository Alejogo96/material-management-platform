import Link from "next/link";
import catalog from "@/db/data/catalog.json";
import { aliasesBySku } from "@/db/data/aliases";
import { getCurrentUser } from "@/lib/session";
import { getLocale, tr } from "@/lib/i18n";
import { AppShell } from "@/components/app-shell";
import { CatalogSearch } from "./catalog-search";

export const metadata = { title: "Catalog · Andy Electric" };

export default async function CatalogPage() {
  const user = await getCurrentUser();
  const locale = user?.locale ?? (await getLocale());
  const t = tr(locale);
  const items = catalog.map((m) => ({ ...m, aliases: aliasesBySku[m.sku] ?? [] }));
  const content = (
    <div className="flex max-w-2xl flex-col gap-6">
      {!user && (
        <Link href="/" className="text-sm font-semibold text-andy-red">
          ← {t("Home", "Inicio")}
        </Link>
      )}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">{t("Catalog with job-site slang", "Catálogo con jerga")}</h1>
        <p className="text-sm text-ink-muted">
          {items.length} {t("sample materials. Try searching the way it's said on site.", "materiales de ejemplo. Prueba buscar como lo dirían en obra.")}
        </p>
      </header>
      <CatalogSearch items={items} locale={locale} />
    </div>
  );
  return user ? (
    <AppShell user={user} active="catalog">{content}</AppShell>
  ) : (
    <main className="mx-auto px-4 py-8 max-w-2xl">{content}</main>
  );
}
