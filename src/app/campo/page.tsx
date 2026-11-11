import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { listRequests } from "@/lib/data";
import { requestKindLabel, requestStatusInfo } from "@/lib/labels";
import { dateFmt, tr } from "@/lib/i18n";
import { Badge, btn } from "@/components/ui";
import { NoDatabase } from "@/components/no-database";
import { confirmReceived } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Home · Andy Electric" };

export default async function CampoHome() {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  const loc = user.locale;
  const requests = await listRequests(user.companyId, { requestedById: user.id });
  const active = requests.filter((r) => !["delivered", "closed", "cancelled"].includes(r.status));
  const done = requests.filter((r) => ["delivered", "closed"].includes(r.status)).slice(0, 5);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col pb-20">
      <header className="bg-andy-black px-5 pt-10 pb-5 text-white">
        <p className="text-xs opacity-80">{dateFmt(loc, new Date())}</p>
        <h1 className="text-2xl font-bold">
          {t("Hi", "Hola")}, {user.fullName.split(" ")[0]}
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-3 px-4 py-4">
        <Link href="/campo/pedido/nuevo" className="flex items-center gap-4 rounded-lg bg-andy-red px-4 py-4 text-white">
          <span className="text-3xl leading-none font-light">+</span>
          <span className="flex-1">
            <span className="block font-heading font-semibold">{t("Order material", "Pedir material")}</span>
            <span className="text-xs opacity-90">{t("For a project or service call", "Para un proyecto o service call")}</span>
          </span>
          <span aria-hidden>›</span>
        </Link>

        <h2 className="mt-3 text-xs font-semibold tracking-wide text-ink-muted">{t("MY ACTIVE ORDERS", "MIS PEDIDOS ACTIVOS")}</h2>
        {active.length === 0 && (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-6 text-center text-sm text-ink-muted">
            {t("You have no active orders. Use “Order material” to create one.", "No tienes pedidos activos. Usa “Pedir material” para crear uno.")}
          </p>
        )}
        {active.map((r) => (
          <article key={r.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <p className="flex-1 font-semibold">
                #{r.number} · {r.projectName}
              </p>
              <Badge tone={requestStatusInfo(t, r.status).tone}>{requestStatusInfo(t, r.status).label}</Badge>
            </div>
            <p className="text-xs text-ink-muted">
              {requestKindLabel(t, r.kind)} · {r.lines} {t("lines", "líneas")} · {t("pickup", "recoger")} {dateFmt(loc, r.neededAt)}
            </p>
            {r.status === "ready" && (
              <form action={confirmReceived}>
                <input type="hidden" name="id" value={r.id} />
                <button className={`${btn.accent} w-full`}>{t("Confirm I received it", "Confirmar que lo recibí")}</button>
              </form>
            )}
          </article>
        ))}

        {done.length > 0 && (
          <>
            <h2 className="mt-3 text-xs font-semibold tracking-wide text-ink-muted">{t("DELIVERED", "ENTREGADOS")}</h2>
            {done.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-lg bg-surface px-4 py-3 text-sm">
                <span className="flex-1">
                  #{r.number} · {r.projectName}
                </span>
                <Badge tone="success">{t("Delivered", "Entregado")}</Badge>
              </div>
            ))}
          </>
        )}
      </main>

      <nav
        aria-label={t("Main", "Principal")}
        className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-lg border-t border-border bg-surface"
      >
        {[
          ["/campo", t("Orders", "Pedidos"), true],
          ["/proyectos", t("Projects", "Proyectos"), false],
          ["/ajustes", t("Settings", "Ajustes"), false],
        ].map(([href, label, on]) => (
          <Link
            key={String(href)}
            href={String(href)}
            aria-current={on ? "page" : undefined}
            className={`flex h-14 flex-1 items-center justify-center text-sm font-semibold ${on ? "text-andy-red" : "text-ink-muted"}`}
          >
            {String(label)}
          </Link>
        ))}
      </nav>
    </div>
  );
}
