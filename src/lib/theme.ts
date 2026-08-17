import { cookies } from "next/headers";

export type Theme = "light" | "dark";
export const THEME_COOKIE = "hifisetup_theme";
export const DEFAULT_THEME: Theme = "light";

/** Theme for the current request, from the cookie the toggle sets. Defaults
 *  to light regardless of OS preference, per the product decision. */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  return store.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;
}
