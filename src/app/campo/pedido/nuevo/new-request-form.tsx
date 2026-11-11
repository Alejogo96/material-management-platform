"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { search } from "@/lib/search";
import { Badge, btn } from "@/components/ui";
import { createRequest } from "@/app/actions";

type Project = { id: string; code: string; name: string; kind: string };
type Material = { id: string; sku: string; name: string; category: string; unit: string; aliases: string[]; stock: number };
type Line = { key: string; materialId: string | null; label: string; unit: string; qty: number; stock: number | null };

function defaultPickup() {
  // Mañana a las 7:30 (hora local del celular)
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(7, 30, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewRequestForm({ projects, catalog }: { projects: Project[]; catalog: Material[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pickup, setPickup] = useState(defaultPickup);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const results = useMemo(() => (query.trim() ? search(catalog, query, 6) : []), [catalog, query]);
  const project = projects.find((p) => p.id === projectId);

  function add(line: Omit<Line, "key" | "qty">) {
    setLines((ls) => {
      const existing = line.materialId && ls.find((l) => l.materialId === line.materialId);
      if (existing) return ls.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { ...line, key: crypto.randomUUID(), qty: 1 }];
    });
    setQuery("");
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createRequest({
        projectId,
        kind: project?.kind === "service_call" ? "urgent" : "daily",
        neededAt: pickup ? new Date(pickup).toISOString() : null,
        note,
        lines: lines.map((l) => ({ materialId: l.materialId, freeText: l.materialId ? null : l.label, qty: l.qty })),
      });
      if (res.error) setError(res.error);
      else router.push("/campo");
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Proyecto o service call</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-12 rounded-md border border-border-strong bg-surface px-3"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Agregar material</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: pipe 3/4, la amarilla, breaker de 20"
          className="h-12 rounded-md border-2 border-border-strong bg-surface px-3.5 outline-none focus:border-andy-red"
        />
        <span className="text-xs text-ink-muted">Escribe como lo dices en obra: español, inglés o jerga.</span>
      </label>

      {query.trim() && (
        <ul className="-mt-2 overflow-hidden rounded-lg border border-border bg-surface">
          {results.map(({ item, matched }) => (
            <li key={item.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => add({ materialId: item.id, label: item.name, unit: item.unit, stock: item.stock })}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{item.name}</span>
                  <span className="block text-xs text-ink-muted">
                    {matched && matched !== item.name ? `coincide con: ${matched}` : item.category}
                  </span>
                </span>
                <Badge tone={item.stock > 0 ? "success" : "danger"}>{item.stock > 0 ? "Hay" : "Falta"}</Badge>
                <span className="text-xl text-andy-red">+</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => add({ materialId: null, label: query.trim(), unit: "", stock: null })}
              className="w-full bg-andy-gold-50 px-4 py-3 text-left text-sm text-andy-gold-dark"
            >
              {results.length ? "¿No es ninguno? " : "No aparece. "}Agregar “{query.trim()}” como texto libre (Jimmy lo
              revisa)
            </button>
          </li>
        </ul>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-ink-muted">MATERIALES DEL PEDIDO ({lines.length})</h2>
        {lines.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-5 text-center text-sm text-ink-muted">
            Busca arriba y toca un material para agregarlo.
          </p>
        )}
        {lines.length > 0 && (
          <ul className="overflow-hidden rounded-lg border border-border bg-surface">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.materialId ? l.label : `“${l.label}”`}</span>
                  <span className="block text-xs text-ink-muted">
                    {l.materialId ? `${l.stock ?? 0} ${l.unit} en bodega` : "texto libre · Jimmy lo concilia"}
                  </span>
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={l.qty}
                  aria-label={`Cantidad de ${l.label}`}
                  onChange={(e) =>
                    setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, qty: Number(e.target.value) } : x)))
                  }
                  className="h-10 w-20 rounded-md border border-border-strong px-2 text-right"
                />
                <button
                  type="button"
                  aria-label={`Quitar ${l.label}`}
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                  className="px-1 text-lg text-ink-muted"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">¿Cuándo lo recoges?</span>
        <input
          type="datetime-local"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="h-12 rounded-md border border-border-strong bg-surface px-3"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">Nota para Jimmy (opcional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-md border border-border-strong bg-surface px-3 py-2"
        />
      </label>

      {error && <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}

      <button type="button" onClick={submit} disabled={pending || lines.length === 0} className={`${btn.accent} mt-1`}>
        {pending ? "Enviando…" : "Enviar pedido a Jimmy"}
      </button>
    </main>
  );
}
