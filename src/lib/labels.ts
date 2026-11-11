import type { Tr } from "@/lib/tr";

export const requestKindLabel = (t: Tr, k: string) =>
  ({
    estimate: t("Estimate", "Estimación"),
    daily: t("Daily", "Diario"),
    urgent: t("Urgent", "Urgente"),
    quick_pickup: t("Quick pickup", "Retiro rápido"),
  })[k] ?? k;

import type { Tone } from "@/lib/data";

export const requestStatusInfo = (t: Tr, st: string): { label: string; tone: Tone } =>
  ({
    draft: { label: t("Draft", "Borrador"), tone: "neutral" as Tone },
    sent: { label: t("Sent", "Enviado"), tone: "info" as Tone },
    preparing: { label: t("Preparing", "En preparación"), tone: "warning" as Tone },
    ready: { label: t("Ready for pickup", "Listo para recoger"), tone: "success" as Tone },
    delivered: { label: t("Delivered", "Entregado"), tone: "success" as Tone },
    partial: { label: t("Partial delivery", "Entrega parcial"), tone: "warning" as Tone },
    closed: { label: t("Closed", "Cerrado"), tone: "neutral" as Tone },
    cancelled: { label: t("Cancelled", "Cancelado"), tone: "neutral" as Tone },
  })[st] ?? { label: st, tone: "neutral" as Tone };

export const lineStateInfo = (t: Tr, st: string): { label: string; tone: Tone } =>
  ({
    unmatched: { label: t("To match", "Por conciliar"), tone: "neutral" as Tone },
    available: { label: t("Available", "Disponible"), tone: "success" as Tone },
    partial: { label: t("Partial", "Parcial"), tone: "warning" as Tone },
    missing: { label: t("Missing", "Falta"), tone: "danger" as Tone },
    delivered: { label: t("Delivered", "Entregado"), tone: "success" as Tone },
  })[st] ?? { label: st, tone: "neutral" as Tone };
