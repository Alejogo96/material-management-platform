"use client";

import { useEffect, useState } from "react";
import { tr, type Locale } from "@/lib/tr";

/** Franja que aparece cuando el teléfono o la computadora pierde la red. */
export function OfflineBanner({ locale }: { locale: Locale }) {
  const t = tr(locale);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-50 bg-andy-gold px-4 py-2 text-center text-sm font-semibold text-andy-black">
      {t("No connection. What you type is kept; nothing is sent until you're back online.", "Sin conexión. Lo que escribes se conserva; nada se envía hasta que vuelva la red.")}
    </div>
  );
}
