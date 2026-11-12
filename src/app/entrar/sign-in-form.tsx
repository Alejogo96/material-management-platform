"use client";

import { startTransition, useActionState } from "react";
import { btn } from "@/components/ui";
import { tr, type Locale } from "@/lib/tr";
import { signIn } from "../actions";

export function SignInForm({ locale }: { locale: Locale }) {
  const t = tr(locale);
  const [state, action, pending] = useActionState(signIn, null);
  const field = "h-12 rounded-md border border-border-strong bg-surface px-3 outline-none focus:border-andy-red";
  return (
    <form onSubmit={(e) => {
        // No se usa action= para que React no vacíe los campos cuando hay un error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Email or user", "Correo o usuario")}</span>
        <input name="email" type="text" inputMode="email" autoCapitalize="none" autoComplete="username" required className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Password", "Contraseña")}</span>
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {state?.error && <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className={btn.accent}>{pending ? t("Signing in…", "Entrando…") : t("Sign in", "Entrar")}</button>
    </form>
  );
}
