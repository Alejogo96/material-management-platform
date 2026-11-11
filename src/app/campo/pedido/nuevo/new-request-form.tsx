"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { search } from "@/lib/search";
import { Badge, btn } from "@/components/ui";
import { tr, type Locale } from "@/lib/tr";
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

export function NewRequestForm({ projects, catalog, locale }: { projects: Project[]; catalog: Material[]; locale: Locale }) {
  const t = tr(locale);
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [pickup, setPickup] = useState(defaultPickup);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [pending, startTransition] = useTransition();

  // Borrador guardado en el teléfono: si se cae la red o se cierra la app, no se pierde el pedido.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("andy-order-draft");
      if (raw) {
        const d = JSON.parse(raw) as { projectId: string; lines: Line[]; note: string };
        if (d.lines?.length && projects.some((p) => p.id === d.projectId)) {
          setProjectId(d.projectId);
          setLines(d.lines);
          setNote(d.note ?? "");
        }
      }
    } catch {}
  }, [projects]);
  useEffect(() => {
    try {
      if (lines.length) localStorage.setItem("andy-order-draft", JSON.stringify({ projectId, lines, note }));
      else localStorage.removeItem("andy-order-draft");
    } catch {}
  }, [projectId, lines, note]);

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

  function submit(confirm = false) {
    setError(null);
    setWarning(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setOffline(true);
      return;
    }
    setOffline(false);
    startTransition(async () => {
      try {
        const res = await createRequest({
          projectId,
          kind: project?.kind === "service_call" ? "urgent" : "daily",
          neededAt: pickup ? new Date(pickup).toISOString() : null,
          note,
          confirm,
          lines: lines.map((l) => ({ materialId: l.materialId, freeText: l.materialId ? null : l.label, qty: l.qty })),
        });
        if (res.error) setError(res.error);
        else if (res.warning) setWarning(res.warning);
        else {
          try {
            localStorage.removeItem("andy-order-draft");
          } catch {}
          router.push("/campo");
        }
      } catch {
        setOffline(true);
      }
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Project or service call", "Proyecto o service call")}</span>
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
        <span className="text-sm font-semibold">{t("Add material", "Agregar material")}</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("e.g. 3/4 pipe, the yellow one, 20 amp breaker", "Ej: pipe 3/4, la amarilla, breaker de 20")}
          className="h-12 rounded-md border-2 border-border-strong bg-surface px-3.5 outline-none focus:border-andy-red"
        />
        <span className="text-xs text-ink-muted">{t("Type it the way you say it on site: Spanish, English or slang.", "Escribe como lo dices en obra: español, inglés o jerga.")}</span>
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
                    {matched && matched !== item.name ? `${t("matches", "coincide con")}: ${matched}` : item.category}
                  </span>
                </span>
                <Badge tone={item.stock > 0 ? "success" : "danger"}>{item.stock > 0 ? t("In stock", "Hay") : t("Out", "Falta")}</Badge>
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
              {results.length ? t("None of these? ", "¿No es ninguno? ") : t("Not found. ", "No aparece. ")}
              {t(`Add “${query.trim()}” as free text (Jimmy reviews it)`, `Agregar “${query.trim()}” como texto libre (Jimmy lo revisa)`)}
            </button>
          </li>
        </ul>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-ink-muted">{t("ORDER MATERIALS", "MATERIALES DEL PEDIDO")} ({lines.length})</h2>
        {lines.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-5 text-center text-sm text-ink-muted">
            {t("Search above and tap a material to add it.", "Busca arriba y toca un material para agregarlo.")}
          </p>
        )}
        {lines.length > 0 && (
          <ul className="overflow-hidden rounded-lg border border-border bg-surface">
            {lines.map((l) => (
              <li key={l.key} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{l.materialId ? l.label : `“${l.label}”`}</span>
                  <span className="block text-xs text-ink-muted">
                    {l.materialId ? `${l.stock ?? 0} ${l.unit} ${t("in warehouse", "en bodega")}` : t("free text · Jimmy matches it", "texto libre · Jimmy lo concilia")}
                  </span>
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={l.qty}
                  aria-label={`${t("Quantity of", "Cantidad de")} ${l.label}`}
                  onChange={(e) =>
                    setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, qty: Number(e.target.value) } : x)))
                  }
                  className="h-10 w-20 rounded-md border border-border-strong px-2 text-right"
                />
                <button
                  type="button"
                  aria-label={`${t("Remove", "Quitar")} ${l.label}`}
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
        <span className="text-sm font-semibold">{t("When will you pick it up?", "¿Cuándo lo recoges?")}</span>
        <input
          type="datetime-local"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          className="h-12 rounded-md border border-border-strong bg-surface px-3"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Note for Jimmy (optional)", "Nota para Jimmy (opcional)")}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="rounded-md border border-border-strong bg-surface px-3 py-2"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {offline && (
        <div role="alert" className="flex flex-col gap-2 rounded-md bg-warning-bg px-3 py-3 text-sm text-warning">
          <p className="font-semibold">{t("No connection — your order is saved on this phone.", "Sin conexión: tu pedido está guardado en este teléfono.")}</p>
          <p>{t("Nothing was lost. When you have signal, tap Try again.", "No se perdió nada. Cuando tengas señal, toca Reintentar.")}</p>
          <button type="button" onClick={() => submit(false)} className={btn.small}>
            {t("Try again", "Reintentar")}
          </button>
        </div>
      )}
      {warning && (
        <div role="alert" className="flex flex-col gap-2 rounded-md bg-andy-gold-50 px-3 py-3 text-sm text-andy-gold-dark">
          <p className="font-semibold">{t("Check before sending", "Revisa antes de enviar")}</p>
          <p>{warning}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setWarning(null)} className={btn.small}>
              {t("Edit order", "Editar pedido")}
            </button>
            <button type="button" onClick={() => submit(true)} className={btn.smallAccent}>
              {t("Send anyway", "Enviar igual")}
            </button>
          </div>
        </div>
      )}

      <button type="button" onClick={() => submit(false)} disabled={pending || lines.length === 0} className={`${btn.accent} mt-1`}>
        {pending ? t("Sending…", "Enviando…") : t("Send order to Jimmy", "Enviar pedido a Jimmy")}
      </button>
    </main>
  );
}
