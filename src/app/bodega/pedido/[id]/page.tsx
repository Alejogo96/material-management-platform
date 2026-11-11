import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getCatalogForSearch, getRequest, kindLabel, lineStateLabel, statusLabel } from "@/lib/data";
import { search } from "@/lib/search";
import { Badge, btn, formatDateTime } from "@/components/ui";
import { deliverFromWarehouse, markPreparing, markReady, matchLine } from "@/app/actions";

export const metadata = { title: "Pedido · Andy Electric" };

export default async function PedidoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const req = await getRequest(user.companyId, id);
  if (!req) notFound();

  const unmatched = req.lines.filter((l) => l.state === "unmatched");
  const catalog = unmatched.length ? await getCatalogForSearch(user.companyId) : [];
  const open = !["delivered", "closed", "cancelled"].includes(req.status);
  const canDeliver = open && req.lines.some((l) => l.state === "available" || l.state === "partial");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/bodega" className="text-sm font-semibold text-andy-red">
        ← Bandeja
      </Link>
      <header className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <p className="text-sm text-ink-muted">
            {kindLabel[req.kind]} · pedido por {req.requester} · recoger {formatDateTime(req.neededAt)}
          </p>
          <h1 className="text-3xl font-bold">
            Pedido #{req.number} · {req.projectName}
          </h1>
        </div>
        <Badge tone={statusLabel[req.status].tone}>{statusLabel[req.status].label}</Badge>
      </header>

      {req.note && <p className="rounded-md bg-andy-gold-50 px-4 py-3 text-sm text-andy-gold-dark">Nota: {req.note}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-subtle text-left text-[11px] tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-2.5 font-semibold">MATERIAL</th>
                <th className="px-4 py-2.5 text-right font-semibold">PEDIDO</th>
                <th className="px-4 py-2.5 text-right font-semibold">ENTREGADO</th>
                <th className="px-4 py-2.5 text-right font-semibold">EN BODEGA</th>
                <th className="px-4 py-2.5 font-semibold">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {req.lines.map((l) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{l.name ?? `“${l.freeText}”`}</td>
                  <td className="px-4 py-3 text-right">
                    {l.requested} {l.unit ?? ""}
                  </td>
                  <td className="px-4 py-3 text-right">{l.delivered}</td>
                  <td className="px-4 py-3 text-right">{l.materialId ? l.available : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={lineStateLabel[l.state].tone}>{lineStateLabel[l.state].label}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="flex flex-col gap-4">
          {open && (
            <section className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
              <h2 className="font-semibold">Acciones</h2>
              {req.status === "sent" && (
                <form action={markPreparing}>
                  <input type="hidden" name="id" value={req.id} />
                  <button className={`${btn.secondary} w-full`}>Empezar a preparar</button>
                </form>
              )}
              {["sent", "preparing"].includes(req.status) && (
                <form action={markReady}>
                  <input type="hidden" name="id" value={req.id} />
                  <button className={`${btn.accent} w-full`}>Marcar como listo</button>
                </form>
              )}
              {canDeliver && (
                <form action={deliverFromWarehouse}>
                  <input type="hidden" name="id" value={req.id} />
                  <button className={`${btn.primary} w-full`}>Entregar ahora</button>
                </form>
              )}
              <p className="text-xs text-ink-muted">
                Al entregar, el stock de bodega se descuenta solo y lo que falte pasa a compras.
              </p>
            </section>
          )}

          {unmatched.map((l) => {
            const suggestions = search(catalog, l.freeText ?? "", 3);
            return (
              <section key={l.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
                <h2 className="font-semibold">Conciliar texto libre</h2>
                <p className="text-sm text-ink-muted">“{l.freeText}”</p>
                {suggestions.length === 0 && (
                  <p className="text-xs text-ink-muted">Sin sugerencias. Búscalo en el catálogo.</p>
                )}
                {suggestions.map(({ item }) => (
                  <form key={item.id} action={matchLine} className="flex items-center gap-2">
                    <input type="hidden" name="lineId" value={l.id} />
                    <input type="hidden" name="requestId" value={req.id} />
                    <input type="hidden" name="materialId" value={item.id} />
                    <span className="flex-1 text-sm">{item.name}</span>
                    <button className={btn.small}>Usar</button>
                  </form>
                ))}
                <p className="text-xs text-ink-muted">El texto se guarda como alias para la próxima vez.</p>
              </section>
            );
          })}
        </aside>
      </div>
    </div>
  );
}
