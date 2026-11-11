import Link from "next/link";
import { btn } from "@/components/ui";
import { getLocale, tr } from "@/lib/i18n";

export default async function NotFound() {
  const t = tr(await getLocale());
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-16">
      <h1 className="text-2xl font-bold">{t("We couldn't find that", "No encontramos eso")}</h1>
      <p className="text-ink-muted">{t("The page or record doesn't exist, or you don't have access to it.", "La página o el registro no existe, o no tienes acceso.")}</p>
      <Link href="/" className={btn.accent}>
        {t("Go to start", "Ir al inicio")}
      </Link>
    </main>
  );
}
