import Link from "next/link";
import { Logo } from "@/components/ui";
import { logout } from "@/app/actions";
import { canSeeCosts, canSeePurchasing, isFieldOnly, type CurrentUser } from "@/lib/session";
import { tr, type Tr } from "@/lib/i18n";

type Item = { key: string; href: string; label: string };

function items(u: CurrentUser, t: Tr): Item[] {
  const list: Item[] = [];
  if (isFieldOnly(u)) list.push({ key: "home", href: "/campo", label: t("My orders", "Mis pedidos") });
  else {
    if (u.roles.some((r) => ["warehouse", "purchasing", "owner", "manager"].includes(r)))
      list.push({ key: "inbox", href: "/bodega", label: t("Inbox", "Bandeja") });
  }
  list.push({ key: "projects", href: "/proyectos", label: t("Projects", "Proyectos") });
  if (canSeeCosts(u)) list.push({ key: "orders", href: "/pedidos", label: t("Orders by project", "Pedidos por proyecto") });
  if (canSeePurchasing(u)) list.push({ key: "purchasing", href: "/compras", label: t("Purchasing", "Compras") });
  list.push({ key: "catalog", href: "/catalogo", label: t("Catalog", "Catálogo") });
  list.push({ key: "settings", href: "/ajustes", label: t("Settings", "Ajustes") });
  if (u.isAdmin) {
    list.push({ key: "users", href: "/admin/usuarios", label: t("People & teams", "Personas y equipos") });
    list.push({ key: "limits", href: "/admin/limites", label: t("Limits", "Límites") });
  }
  return list;
}

export function AppShell({ user, active, children }: { user: CurrentUser; active: string; children: React.ReactNode }) {
  const t = tr(user.locale);
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="bg-andy-black px-4 py-3 md:w-60 md:shrink-0 md:px-5 md:py-6">
        <div className="flex items-center justify-between md:block">
          <Logo dark tagline={t("Material management", "Gestión de material")} />
          <form action={logout} className="md:hidden">
            <button className="text-xs text-white/70 underline">{t("Sign out", "Salir")}</button>
          </form>
        </div>
        <nav aria-label={t("Main", "Principal")} className="-mx-1 mt-3 flex gap-1 overflow-x-auto md:mx-0 md:mt-8 md:flex-col md:overflow-visible">
          {items(user, t).map((i) => (
            <Link
              key={i.key}
              href={i.href}
              aria-current={i.key === active ? "page" : undefined}
              className={`shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap ${
                i.key === active ? "bg-andy-red font-semibold text-white" : "text-white/85 hover:bg-white/10"
              }`}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8 hidden md:block">
          <p className="text-xs text-white/70">{user.fullName}</p>
          <button className="text-xs text-white/70 underline">{t("Sign out", "Salir")}</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
