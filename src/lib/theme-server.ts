import { cookies } from "next/headers";
import { DEFAULT_THEME, THEME_COOKIE, type Theme } from "@/lib/theme";

/** Theme for the current request, from the cookie the toggle sets. Defaults
 *  to light regardless of OS preference, per the product decision. */
export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  return store.get(THEME_COOKIE)?.value === "dark" ? "dark" : DEFAULT_THEME;
}
