import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { Logo, NoDatabase } from "@/components/ui";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export default async function BodegaLayout({ children }: { children: React.ReactNode }) {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex items-center justify-between gap-6 bg-andy-black px-5 py-4 md:w-60 md:flex-col md:items-stretch md:justify-start md:py-6">
        <Logo dark />
        <nav className="flex gap-1 md:flex-col">
          <Link href="/bodega" className="rounded-md bg-andy-red px-3 py-2 text-sm font-semibold text-white">
            Pedidos
          </Link>
          <Link href="/catalogo" className="rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10">
            Catálogo
          </Link>
        </nav>
        <form action={logout} className="hidden md:mt-auto md:block">
          <p className="text-xs text-white/70">{user.fullName}</p>
          <button className="text-xs text-white/70 underline">Cambiar persona</button>
        </form>
      </aside>
      <div className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
