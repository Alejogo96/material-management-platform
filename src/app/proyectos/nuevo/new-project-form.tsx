"use client";

import { useState, useTransition } from "react";
import { btn } from "@/components/ui";
import { tr, type Locale } from "@/lib/tr";
import { createProject } from "../actions";

type Opt = { id: string; name: string };
type Type = "rough_in" | "trim" | "both" | "service_call" | "other";

const DEFAULT_PHASES: Record<Type, string[]> = {
  rough_in: ["Rough-in"],
  trim: ["Trim"],
  both: ["Rough-in", "Trim"],
  service_call: [],
  other: [],
};
const INSPECTIONS = ["Rough-in", "Utility", "Final"];

const field = "h-12 rounded-md border border-border-strong bg-surface px-3 outline-none focus:border-andy-red";

export function NewProjectForm({ locale, people, vans, defaultLead }: { locale: Locale; people: Opt[]; vans: Opt[]; defaultLead: string }) {
  const t = tr(locale);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [client, setClient] = useState("");
  const [leadId, setLeadId] = useState(defaultLead);
  const [vanId, setVanId] = useState(vans[0]?.id ?? "");
  const [type, setType] = useState<Type>("rough_in");
  const [typeOther, setTypeOther] = useState("");
  const [budget, setBudget] = useState("");
  const [phases, setPhases] = useState(DEFAULT_PHASES.rough_in.map((n) => ({ name: n, spec: "" })));
  const [insp, setInsp] = useState<Record<string, { on: boolean; date: string }>>(
    Object.fromEntries(INSPECTIONS.map((n) => [n, { on: n === "Rough-in", date: "" }])),
  );
  const [otherInsp, setOtherInsp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const types: { v: Type; label: string }[] = [
    { v: "rough_in", label: "Roof / rough-in" },
    { v: "trim", label: "Trim" },
    { v: "both", label: t("Both", "Ambos") },
    { v: "service_call", label: "Service call" },
    { v: "other", label: t("Other", "Otro") },
  ];

  function pickType(v: Type) {
    setType(v);
    // Solo se reemplazan las fases si todavía no se escribió ninguna especificación.
    if (phases.every((p) => !p.spec.trim())) setPhases(DEFAULT_PHASES[v].map((n) => ({ name: n, spec: "" })));
  }

  const msgs: Record<string, string> = {
    name: t("Add a project name.", "Escribe el nombre del proyecto."),
    address: t("Add the address.", "Escribe la dirección."),
    typeOther: t("Say what type of project it is.", "Especifica el tipo de proyecto."),
    budget: t("The material budget must be a number.", "El presupuesto de material debe ser un número."),
  };

  function submit() {
    setError(null);
    start(async () => {
      try {
        const res = await createProject({
          name,
          address,
          clientName: client,
          leadId,
          vanId,
          type,
          typeOther,
          materialBudget: budget,
          phases,
          inspections: [
            ...INSPECTIONS.filter((n) => insp[n].on).map((n) => ({ name: n, dueDate: insp[n].date })),
            ...(otherInsp.trim() ? [{ name: otherInsp.trim(), dueDate: "" }] : []),
          ],
        });
        if (res?.error) setError(msgs[res.error] ?? t("Could not create the project.", "No se pudo crear el proyecto."));
      } catch (e) {
        // redirect() lanza una excepción especial: se deja pasar.
        if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;
        setError(t("Could not save. Check your connection and try again — your data is still here.", "No se pudo guardar. Revisa tu conexión e intenta de nuevo: tus datos siguen aquí."));
      }
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4 md:p-5">
        <h2 className="font-semibold">{t("Basics", "Datos básicos")}</h2>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t("Project name", "Nombre del proyecto")}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Maple Dr remodel" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t("Address", "Dirección")}</span>
          <input value={address} onChange={(e) => setAddress(e.target.value)} className={field} placeholder="88 Maple Dr" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t("Client (optional)", "Cliente (opcional)")}</span>
          <input value={client} onChange={(e) => setClient(e.target.value)} className={field} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{t("Lead in charge", "Encargado")}</span>
            <select value={leadId} onChange={(e) => setLeadId(e.target.value)} className={field}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">{t("Team / van", "Equipo / van")}</span>
            <select value={vanId} onChange={(e) => setVanId(e.target.value)} className={field}>
              <option value="">{t("Not assigned yet", "Sin asignar todavía")}</option>
              {vans.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t("Material budget in USD (optional)", "Presupuesto de material en USD (opcional)")}</span>
          <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" className={field} placeholder="18400" />
        </label>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
        <h2 className="font-semibold">{t("Project type", "Tipo de proyecto")}</h2>
        <div role="radiogroup" className="flex flex-wrap gap-2">
          {types.map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={type === o.v}
              onClick={() => pickType(o.v)}
              className={`h-11 rounded-full border px-4 text-sm font-semibold ${
                type === o.v ? "border-andy-red bg-andy-red text-white" : "border-border-strong bg-surface hover:bg-subtle"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {type === "other" && (
          <input
            value={typeOther}
            onChange={(e) => setTypeOther(e.target.value)}
            className={field}
            placeholder={t("Specify the type (e.g. generator install)", "Especifica el tipo (ej. instalación de generador)")}
            aria-label={t("Specify the type", "Especifica el tipo")}
          />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
        <h2 className="font-semibold">{t("Phases and specifications", "Fases y especificaciones")}</h2>
        {phases.length === 0 && (
          <p className="text-sm text-ink-muted">{t("No phases yet. Service calls usually don't need them.", "Sin fases todavía. Los service calls normalmente no las necesitan.")}</p>
        )}
        {phases.map((p, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-border p-3">
            <div className="flex gap-2">
              <input
                value={p.name}
                onChange={(e) => setPhases((ps) => ps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                aria-label={t("Phase name", "Nombre de la fase")}
                className={`${field} flex-1`}
                placeholder={t("Phase name", "Nombre de la fase")}
              />
              <button
                type="button"
                aria-label={t("Remove phase", "Quitar fase")}
                onClick={() => setPhases((ps) => ps.filter((_, j) => j !== i))}
                className="px-2 text-xl text-ink-muted"
              >
                ×
              </button>
            </div>
            <textarea
              value={p.spec}
              onChange={(e) => setPhases((ps) => ps.map((x, j) => (j === i ? { ...x, spec: e.target.value } : x)))}
              rows={2}
              aria-label={t("Specifications", "Especificaciones")}
              placeholder={t("Specifications: panel size, circuits, special materials…", "Especificaciones: tamaño de panel, circuitos, materiales especiales…")}
              className="rounded-md border border-border-strong bg-surface px-3 py-2"
            />
          </div>
        ))}
        <button type="button" onClick={() => setPhases((ps) => [...ps, { name: "", spec: "" }])} className={`${btn.small} self-start`}>
          + {t("Add phase", "Agregar fase")}
        </button>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
        <h2 className="font-semibold">{t("Inspections to pass", "Revisiones por pasar")}</h2>
        {INSPECTIONS.map((n) => (
          <div key={n} className="flex flex-wrap items-center gap-3">
            <label className="flex min-w-40 items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={insp[n].on}
                onChange={(e) => setInsp((s) => ({ ...s, [n]: { ...s[n], on: e.target.checked } }))}
                className="size-5 accent-andy-red"
              />
              {n}
            </label>
            {insp[n].on && (
              <input
                type="date"
                value={insp[n].date}
                aria-label={`${n} — ${t("date", "fecha")}`}
                onChange={(e) => setInsp((s) => ({ ...s, [n]: { ...s[n], date: e.target.value } }))}
                className="h-10 rounded-md border border-border-strong px-2"
              />
            )}
          </div>
        ))}
        <input
          value={otherInsp}
          onChange={(e) => setOtherInsp(e.target.value)}
          className={field}
          placeholder={t("Other inspection (optional)", "Otra revisión (opcional)")}
          aria-label={t("Other inspection", "Otra revisión")}
        />
      </section>

      {error && (
        <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button type="button" onClick={submit} disabled={pending} className={`${btn.accent} md:self-start md:px-10`}>
        {pending ? t("Creating…", "Creando…") : t("Create project", "Crear proyecto")}
      </button>
    </div>
  );
}
