import { db } from "@/db";
import { requireAdminPage } from "@/lib/admin";
import { tr } from "@/lib/i18n";
import { getSettings } from "@/lib/projects";
import { AppShell } from "@/components/app-shell";
import { NoDatabase } from "@/components/no-database";
import { NotAdmin } from "../not-admin";
import { LimitsForm } from "../user-form";

export const dynamic = "force-dynamic";

export default async function Limites() {
  if (!db) return <NoDatabase />;
  const user = await requireAdminPage();
  if (!user.isAdmin) return <NotAdmin user={user} />;
  const t = tr(user.locale);
  const settings = await getSettings(user.companyId);
  return (
    <AppShell user={user} active="limits">
      <h1 className="mb-1 text-3xl font-bold">{t("Limits", "Límites")}</h1>
      <p className="mb-6 text-ink-muted">{t("Company-wide rules. Changes apply right away.", "Reglas de toda la empresa. Los cambios aplican de inmediato.")}</p>
      <LimitsForm locale={user.locale} values={settings} />
    </AppShell>
  );
}
