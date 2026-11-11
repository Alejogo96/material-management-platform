export type Locale = "en" | "es";

/** Traductor inline: tr(locale)("Projects", "Proyectos"). El inglés (EE. UU.) es el idioma por defecto. */
export function tr(locale: Locale) {
  return (en: string, es: string) => (locale === "es" ? es : en);
}
export type Tr = ReturnType<typeof tr>;
