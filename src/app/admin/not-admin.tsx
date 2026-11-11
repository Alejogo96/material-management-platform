import { AppShell } from "@/components/app-shell";
import { tr } from "@/lib/i18n";
import type { CurrentUser } from "@/lib/session";

export function NotAdmin({ user }: { user: CurrentUser }) {
  const t = tr(user.locale);
  return (
    <AppShell user={user} active="settings">
      <div className="flex max-w-xl flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("Admins only", "Solo administradores")}</h1>
        <p className="text-ink-muted">
          {t("This section is for Andrés, Miguel, Jimmy and Karina. Ask one of them if you need a change.", "Esta sección es para Andrés, Miguel, Jimmy y Karina. Pídele a uno de ellos si necesitas un cambio.")}
        </p>
      </div>
    </AppShell>
  );
}
