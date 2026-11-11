import Image from "next/image";
import Link from "next/link";

const phases = [
  { name: "Fase 0 · Base", status: "En curso", items: ["Proyecto Next.js con el brand de Andy", "Modelo de datos y datos de ejemplo", "Búsqueda de catálogo con jerga"] },
  { name: "Fase 1 · MVP demostrable", status: "Siguiente", items: ["Pedidos desde el celular", "Bandeja de Jimmy", "Inventario de bodega y vans", "Estimado vs real por proyecto"] },
  { name: "Fase 2 · Operación real", status: "Después", items: ["Cotizaciones y compras", "Sobrantes y chatarrería", "Métricas"] },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-andy-black px-5 pt-10 pb-6 text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Image src="/andy-mark.svg" alt="" width={20} height={35} priority />
          <div>
            <p className="font-heading text-lg font-bold">Andy Electric</p>
            <p className="text-xs opacity-80">Gestión de material</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Cada material, ligado a su proyecto.</h1>
          <p className="text-ink-muted">
            Pedidos desde el celular, una sola bandeja para la bodega, inventario de bodega y vans, y faltantes listos
            para compras.
          </p>
        </section>

        <Link
          href="/catalogo"
          className="flex items-center justify-between rounded-lg bg-andy-red px-5 py-4 font-heading font-semibold text-white hover:bg-andy-red-dark"
        >
          Probar la búsqueda de catálogo con jerga
          <span aria-hidden>→</span>
        </Link>

        <section className="grid gap-3 sm:grid-cols-3">
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
