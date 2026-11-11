import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { listRequests } from "@/lib/data";
import { requestKindLabel, requestStatusInfo } from "@/lib/labels";
import { dateFmt, tr } from "@/lib/i18n";
import { Badge } from "@/components/ui";

export const metadata = { title: "Inbox · Andy Electric" };

export default async function Bandeja() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  const loc = user.locale;
  const all = await listRequests(user.companyId);
  const open = all.filter((r) => ["sent", "preparing", "ready", "partial"].includes(r.status));
  const kpis = [
    { label: t("TO PREPARE", "POR PREPARAR"), value: all.filter((r) => ["sent", "preparing"].includes(r.status)).length, cls: "text-andy-red" },
    { label: t("READY FOR PICKUP", "LISTOS PARA RECOGER"), value: all.filter((r) => r.status === "ready").length, cls: "" },
    { label: t("FREE TEXT TO MATCH", "TEXTO LIBRE POR CONCILIAR"), value: open.reduce((n, r) => n + r.unmatched, 0), cls: "text-andy-gold-dark" },
    { label: t("PARTIAL DELIVERIES", "ENTREGAS PARCIALES"), value: all.filter((r) => r.status === "partial").length, cls: "" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-ink-muted">{t("Warehouse", "Bodega")} · {dateFmt(loc, new Date())}</p>
        <h1 className="text-3xl font-bold">{t("Order inbox", "Bandeja de pedidos")}</h1>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[11px] font-semibold tracking-wide text-ink-muted">{k.label}</p>
            <p className={`font-heading text-3xl font-bold ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </section>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-subtle text-left text-[11px] tracking-wide text-ink-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">{t("ORDER", "PEDIDO")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("PROJECT", "PROYECTO")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("REQUESTED BY", "SOLICITA")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("PICKUP", "RECOGER")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("TYPE", "TIPO")}</th>
              <th className="px-4 py-2.5 font-semibold">{t("STATUS", "ESTADO")}</th>
            </tr>
          </thead>
          <tbody>
            {all.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-page">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/bodega/pedido/${r.id}`} className="text-andy-red hover:underline">
                    #{r.number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {r.projectName}
                  <span className="block text-xs text-ink-muted">
                    {r.lines} {t("lines", "líneas")}{r.unmatched ? ` · ${r.unmatched} ${t("to match", "por conciliar")}` : ""}
                  </span>
                </td>
                <td className="px-4 py-3">{r.requester}</td>
                <td className="px-4 py-3">{dateFmt(loc, r.neededAt)}</td>
                <td className="px-4 py-3">
                  <Badge tone={r.kind === "urgent" ? "danger" : "neutral"}>{requestKindLabel(t, r.kind)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={requestStatusInfo(t, r.status).tone}>{requestStatusInfo(t, r.status).label}</Badge>
                </td>
              </tr>
            ))}
            {all.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                  {t("No orders yet. When a leader orders from the phone it shows up here.", "Todavía no hay pedidos. Cuando un líder pida desde el celular aparecerá aquí.")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
