"use client";

import { useMemo, useState } from "react";
import { search, type Searchable } from "@/lib/search";
import { tr, type Locale } from "@/lib/tr";

type Item = Searchable & { category: string; unit: string; stock: number; minStock: number };

const examples = ["pipe 3/4", "la amarilla", "breaker de 20", "wire 12 negro", "3/4 emt", "fotocelda"];

function StockBadge({ stock, min, locale }: { stock: number; min: number; locale: Locale }) {
  const t = tr(locale);
  const [label, cls] =
    stock === 0
      ? [t("Out", "Falta"), "bg-danger-bg text-danger"]
      : stock < min
        ? [t("Low", "Pocos"), "bg-warning-bg text-warning"]
        : [t("In stock", "Disponible"), "bg-success-bg text-success"];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export function CatalogSearch({ items, locale }: { items: Item[]; locale: Locale }) {
  const t = tr(locale);
  const [query, setQuery] = useState("pipe 3/4");
  const results = useMemo(() => search(items, query), [items, query]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Search material", "Buscar material")}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. 3/4 EMT pipe, 12 THHN wire…", "Ej: tubo EMT 3/4, wire 12 THHN…")}
          className="h-12 rounded-md border-2 border-border-strong bg-surface px-3.5 text-base outline-none focus:border-andy-red"
        />
        <span className="text-xs text-ink-muted">{t("Type it the way you say it on site: Spanish, English or slang.", "Escribe como lo dices en obra: español, inglés o jerga.")}</span>
      </label>

      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setQuery(ex)}
            className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold hover:bg-andy-red-50"
          >
            {ex}
          </button>
        ))}
      </div>

      <ul className="overflow-hidden rounded-lg border border-border bg-surface">
        {results.map(({ item, matched }) => (
          <li key={item.sku} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="text-xs text-ink-muted">
                {matched && matched !== item.name ? `${t("matches", "coincide con")}: ${matched} · ` : ""}
                {item.category}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StockBadge stock={item.stock} min={item.minStock} locale={locale} />
              <span className="text-xs font-semibold whitespace-nowrap text-ink-muted">
                {item.stock} {item.unit}
              </span>
            </div>
          </li>
        ))}
        {query && results.length === 0 && (
          <li className="bg-andy-gold-50 px-4 py-4 text-sm text-andy-gold-dark">
            {t(
              "Not in the catalog. In an order it stays as free text and Jimmy matches it; that text is saved as a new alias.",
              "No aparece en el catálogo. En el pedido quedará como texto libre y Jimmy lo concilia; ese texto se guarda como alias nuevo.",
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
