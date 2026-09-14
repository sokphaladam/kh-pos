import type { Locale } from "./config";
import { namespaces } from "./namespaces";

export async function getMessagesForLocale(locale: Locale) {
  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    }),
  );

  return Object.fromEntries(entries);
}
