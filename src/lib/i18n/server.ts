import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, dictionaries, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

const isLocale = (value: string | undefined): value is Locale => LOCALES.includes(value as Locale);

/** Locale for the current request, from the cookie the switcher sets. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}
