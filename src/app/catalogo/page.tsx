import Link from "next/link";
import catalog from "@/db/data/catalog.json";
import { aliasesBySku } from "@/db/data/aliases";
import { CatalogSearch } from "./catalog-search";

export const metadata = { title: "Catálogo · Andy Electric" };

export default function CatalogPage() {
  const items = catalog.map((m) => ({ ...m, aliases: aliasesBySku[m.sku] ?? [] }));
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-sm font-semibold text-andy-red">
        ← Inicio
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Catálogo con jerga</h1>
        <p className="text-sm text-ink-muted">
          {items.length} materiales de ejemplo. Prueba buscar como lo dirían en obra.
        </p>
      </header>
      <CatalogSearch items={items} />
    </main>
  );
}
