"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { btn } from "@/components/ui";
import { tr, type Locale } from "@/lib/tr";

/** Pantalla de error con salida clara: reintentar o volver al inicio. */
export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [locale, setLocale] = useState<Locale>("en");
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    setLocale(document.documentElement.lang === "es" ? "es" : "en");
    setOffline(!navigator.onLine);
  }, []);
  const t = tr(locale);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-6 py-16">
      <p className="font-heading text-4xl font-bold text-andy-red" aria-hidden>
        !
      </p>
      <h1 className="text-2xl font-bold">
        {offline ? t("No connection", "Sin conexión") : t("This page didn't load", "Esta página no cargó")}
      </h1>
      <p className="text-ink-muted">
        {offline
          ? t("Check your signal or Wi-Fi. Nothing you typed was lost.", "Revisa tu señal o el Wi-Fi. No se perdió nada de lo que escribiste.")
          : t("It's us, not you. Try again; if it keeps failing, tell Jimmy or an admin.", "Fue un problema nuestro, no tuyo. Intenta de nuevo; si sigue fallando, avísale a Jimmy o a un admin.")}
      </p>
      {error.digest && <p className="text-xs text-ink-muted">{t("Reference", "Referencia")}: {error.digest}</p>}
      <button onClick={reset} className={btn.accent}>
        {t("Try again", "Reintentar")}
      </button>
      <Link href="/" className={btn.secondary}>
        {t("Go to start", "Ir al inicio")}
      </Link>
    </main>
  );
}
