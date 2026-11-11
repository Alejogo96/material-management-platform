import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getActiveProjects, getCatalogForSearch } from "@/lib/data";
import { NoDatabase } from "@/components/no-database";
import { tr } from "@/lib/i18n";
import { NewRequestForm } from "./new-request-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New order · Andy Electric" };

export default async function NuevoPedido() {
  if (!db) return <NoDatabase />;
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const t = tr(user.locale);
  const [projects, catalog] = await Promise.all([getActiveProjects(user.companyId), getCatalogForSearch(user.companyId)]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
      <header className="bg-andy-black px-5 pt-10 pb-5 text-white">
        <Link href="/campo" className="text-xs opacity-80">
          ← {t("Back", "Volver")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{t("New order", "Nuevo pedido")}</h1>
      </header>
      <NewRequestForm projects={projects} catalog={catalog} locale={user.locale} />
    </div>
  );
}
