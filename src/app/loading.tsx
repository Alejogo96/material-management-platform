/** Esqueleto mientras carga una pantalla (aparece si tarda más de un instante). */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8" role="status" aria-label="Loading">
      <div className="h-8 w-1/2 animate-pulse rounded bg-subtle" />
      <div className="h-24 animate-pulse rounded-lg bg-subtle" />
      <div className="h-24 animate-pulse rounded-lg bg-subtle" />
      <div className="h-24 animate-pulse rounded-lg bg-subtle" />
    </div>
  );
}
