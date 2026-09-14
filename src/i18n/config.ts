export const locales = ["km", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "km";

export const localeCookieName = "NEXT_LOCALE";

export const localeLabels: Record<Locale, string> = {
  km: "ខ្មែរ",
  en: "English",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
