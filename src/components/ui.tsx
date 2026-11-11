import Image from "next/image";
import Link from "next/link";
import type { Tone } from "@/lib/data";

const toneCls: Record<Tone, string> = {
  neutral: "bg-subtle text-ink",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  brand: "bg-andy-red-50 text-andy-red",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${toneCls[tone]}`}>
      {children}
    </span>
  );
}

const btnBase =
  "inline-flex items-center justify-center rounded-md px-5 font-heading font-semibold transition-colors disabled:opacity-50";
export const btn = {
  primary: `${btnBase} h-12 bg-andy-black text-white hover:bg-andy-gray`,
  accent: `${btnBase} h-12 bg-andy-red text-white hover:bg-andy-red-dark`,
  secondary: `${btnBase} h-12 border border-border-strong bg-surface text-ink hover:bg-subtle`,
  small: `${btnBase} h-10 px-4 text-sm border border-border-strong bg-surface text-ink hover:bg-subtle`,
  smallAccent: `${btnBase} h-10 px-4 text-sm bg-andy-red text-white hover:bg-andy-red-dark`,
};

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/andy-mark.svg" alt="" width={16} height={28} />
      <div className="leading-tight">
        <p className={`font-heading text-sm font-bold ${dark ? "text-white" : ""}`}>Andy Electric</p>
        <p className={`text-[11px] ${dark ? "text-white/75" : "text-ink-muted"}`}>Gestión de material</p>
      </div>
    </div>
  );
}

export function NoDatabase() {
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-16">
      <Logo />
      <h1 className="text-2xl font-bold">Falta conectar la base de datos</h1>
      <p className="text-ink-muted">
        Esta parte de la demo necesita Supabase. Agrega la variable <code>DATABASE_URL</code> en Vercel (o en{" "}
        <code>.env.local</code>) y vuelve a desplegar.
      </p>
      <Link href="/catalogo" className={btn.secondary}>
        Mientras tanto, probar el catálogo con jerga
      </Link>
    </main>
  );
}

export function formatDateTime(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(d);
}
