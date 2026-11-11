import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { kindLabel, listRequests, statusLabel } from "@/lib/data";
import { Badge, NoDatabase, btn, formatDateTime } from "@/components/ui";
import { confirmReceived, logout } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inicio · Andy Electric" };

export default async function CampoHome() {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const requests = await listRequests(user.companyId, { requestedById: user.id });
  const active = requests.filter((r) => !["delivered", "closed", "cancelled"].includes(r.status));
  const done = requests.filter((r) => ["delivered", "closed"].includes(r.status)).slice(0, 5);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="bg-andy-black px-5 pt-10 pb-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs opacity-80">{formatDateTime(new Date())}</p>
            <h1 className="text-2xl font-bold">Hola, {user.fullName.split(" ")[0]}</h1>
          </div>
          <form action={logout}>
            <button className="text-xs underline opacity-80">Cambiar persona</button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-4 py-4">
        <Link href="/campo/pedido/nuevo" className="flex items-center gap-4 rounded-lg bg-andy-red px-4 py-4 text-white">
          <span className="text-3xl leading-none font-light">+</span>
          <span className="flex-1">
            <span className="block font-heading font-semibold">Pedir material</span>
            <span className="text-xs opacity-90">Para un proyecto o service call</span>
          </span>
          <span aria-hidden>›</span>
        </Link>

        <h2 className="mt-3 text-xs font-semibold tracking-wide text-ink-muted">MIS PEDIDOS ACTIVOS</h2>
        {active.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-ink-muted">
            No tienes pedidos activos. Usa “Pedir material” para crear uno.
          </p>
        )}
        {active.map((r) => (
          <article key={r.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <p className="flex-1 font-semibold">
                #{r.number} · {r.projectName}
              </p>
              <Badge tone={statusLabel[r.status].tone}>{statusLabel[r.status].label}</Badge>
            </div>
            <p className="text-xs text-ink-muted">
              {kindLabel[r.kind]} · {r.lines} líneas · recoger {formatDateTime(r.neededAt)}
            </p>
            {r.status === "ready" && (
              <form action={confirmReceived}>
                <input type="hidden" name="id" value={r.id} />
                <button className={`${btn.accent} w-full`}>Confirmar que lo recibí</button>
              </form>
            )}
          </article>
        ))}

        {done.length > 0 && (
          <>
            <h2 className="mt-3 text-xs font-semibold tracking-wide text-ink-muted">ENTREGADOS</h2>
            {done.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg bg-surface px-4 py-3 text-sm">
                <span className="flex-1">
                  #{r.number} · {r.projectName}
                </span>
                <Badge tone="success">Entregado</Badge>
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  );
}
