"use client";

import { startTransition, useActionState } from "react";
import { btn } from "@/components/ui";
import { tr, type Locale } from "@/lib/tr";
import { createUser, resetPassword, saveLimits, updateUser, type FormState } from "./actions";

type Team = { id: string; name: string };
export type UserFormValues = {
  id?: string;
  fullName: string;
  email: string;
  teamId: string;
  roles: string[];
  isAdmin: boolean;
  active: boolean;
  locale: string;
};

const field = "h-12 rounded-md border border-border-strong bg-surface px-3 outline-none focus:border-andy-red";

export function UserForm({ locale, teams, values, isSelf }: { locale: Locale; teams: Team[]; values?: UserFormValues; isSelf?: boolean }) {
  const t = tr(locale);
  const editing = !!values?.id;
  const [state, action, pending] = useActionState<FormState, FormData>(editing ? updateUser : createUser, null);
  const roleOpts: [string, string][] = [
    ["van_leader", t("Van leader", "Líder de van")],
    ["manager", "Manager"],
    ["owner", t("Owner", "Dueño")],
    ["warehouse", t("Warehouse", "Bodega")],
    ["purchasing", t("Purchasing / office", "Compras / oficina")],
  ];
  return (
    <form onSubmit={(e) => {
        // No se usa action= para que React no vacíe los campos cuando hay un error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }} className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-4 md:p-5">
      {editing && <input type="hidden" name="id" value={values!.id} />}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Full name", "Nombre completo")}</span>
        <input name="fullName" defaultValue={values?.fullName} required className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Email", "Correo")}</span>
        <input name="email" type="email" defaultValue={values?.email} required={!editing} autoComplete="off" className={field} />
      </label>
      {!editing && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">{t("Password", "Contraseña")}</span>
          <input name="password" type="password" minLength={8} required autoComplete="new-password" className={field} />
          <span className="text-xs text-ink-muted">{t("At least 8 characters. They can use it right away.", "Al menos 8 caracteres. La persona puede usarla de inmediato.")}</span>
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Team / van", "Equipo / van")}</span>
        <select name="teamId" defaultValue={values?.teamId ?? ""} className={field}>
          <option value="">{t("No team", "Sin equipo")}</option>
          {teams.map((x) => (
            <option key={x.id} value={x.id}>{x.name}</option>
          ))}
        </select>
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t("Role", "Rol")}</legend>
        {roleOpts.map(([v, label]) => (
          <label key={v} className="flex items-center gap-2">
            <input type="checkbox" name="roles" value={v} defaultChecked={values ? values.roles.includes(v) : v === "van_leader"} className="size-5 accent-andy-red" />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isAdmin" defaultChecked={values?.isAdmin} disabled={isSelf} className="size-5 accent-andy-red" />
        <span>
          <span className="font-semibold">{t("Administrator", "Administrador")}</span>
          <span className="block text-xs text-ink-muted">{t("Can manage people, teams and limits.", "Puede gestionar personas, equipos y límites.")}</span>
        </span>
        {isSelf && values?.isAdmin && <input type="hidden" name="isAdmin" value="on" />}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Language", "Idioma")}</span>
        <select name="locale" defaultValue={values?.locale ?? "en"} className={field}>
          <option value="en">English (US)</option>
          <option value="es">Español</option>
        </select>
      </label>
      {editing && (
        <label className="flex items-center gap-2">
          <input type="checkbox" name="active" defaultChecked={values?.active} disabled={isSelf} className="size-5 accent-andy-red" />
          {t("Active (can sign in)", "Activo (puede entrar)")}
          {isSelf && <input type="hidden" name="active" value="on" />}
        </label>
      )}
      {state?.error && <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {editing && state && !state.error && <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">{t("Saved.", "Guardado.")}</p>}
      <button disabled={pending} className={btn.accent}>
        {pending ? t("Saving…", "Guardando…") : editing ? t("Save changes", "Guardar cambios") : t("Create profile", "Crear perfil")}
      </button>
    </form>
  );
}

export function ResetPasswordForm({ locale, id }: { locale: Locale; id: string }) {
  const t = tr(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, null);
  return (
    <form onSubmit={(e) => {
        // No se usa action= para que React no vacíe los campos cuando hay un error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }} className="flex max-w-xl flex-col gap-3 rounded-lg border border-border bg-surface p-4 md:p-5">
      <input type="hidden" name="id" value={id} />
      <h2 className="font-semibold">{t("Reset password", "Restablecer contraseña")}</h2>
      <input name="password" type="password" minLength={8} required autoComplete="new-password" aria-label={t("New password", "Nueva contraseña")} placeholder={t("New password (8+ characters)", "Nueva contraseña (8+ caracteres)")} className={field} />
      {state?.error && <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state && !state.error && <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">{t("Password updated.", "Contraseña actualizada.")}</p>}
      <button disabled={pending} className={`${btn.secondary} self-start`}>{t("Update password", "Actualizar contraseña")}</button>
    </form>
  );
}

export function LimitsForm({ locale, values }: { locale: Locale; values: { approvalThreshold: number; excessPct: number; reminderHours: number } }) {
  const t = tr(locale);
  const [state, action, pending] = useActionState<FormState, FormData>(saveLimits, null);
  return (
    <form onSubmit={(e) => {
        // No se usa action= para que React no vacíe los campos cuando hay un error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }} className="flex max-w-xl flex-col gap-4 rounded-lg border border-border bg-surface p-4 md:p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Purchase approval amount (USD)", "Monto de aprobación de compras (USD)")}</span>
        <input name="approvalThreshold" type="number" min={0} step="1" defaultValue={values.approvalThreshold} className={field} />
        <span className="text-xs text-ink-muted">{t("Purchases above this amount need Miguel (or Karina) to approve.", "Las compras por encima de este monto las aprueba Miguel (o Karina).")}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Allowed excess over the estimate (%)", "Exceso permitido sobre el estimado (%)")}</span>
        <input name="excessPct" type="number" min={0} max={100} step="1" defaultValue={values.excessPct} className={field} />
        <span className="text-xs text-ink-muted">{t("Orders beyond this get a warning before they are sent.", "Los pedidos que pasen de esto muestran una advertencia antes de enviarse.")}</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold">{t("Pickup reminder (hours before)", "Recordatorio de recogida (horas antes)")}</span>
        <input name="reminderHours" type="number" min={1} max={72} step="1" defaultValue={values.reminderHours} className={field} />
      </label>
      {state?.error && <p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{state.error}</p>}
      {state && !state.error && <p role="status" className="rounded-md bg-success-bg px-3 py-2 text-sm text-success">{t("Saved.", "Guardado.")}</p>}
      <button disabled={pending} className={btn.accent}>{pending ? t("Saving…", "Guardando…") : t("Save limits", "Guardar límites")}</button>
    </form>
  );
}
