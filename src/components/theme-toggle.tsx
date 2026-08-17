"use client";

import { useRouter } from "next/navigation";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ThemeToggle({ theme, t }: { theme: Theme; t: Dictionary }) {
  const router = useRouter();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    // One year, site-wide: the server reads this cookie on every request.
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={t.theme.label} aria-pressed={theme === "dark"} title={theme === "dark" ? t.theme.dark : t.theme.light}>
      {theme === "dark" ? "☾" : "☀"}
    </button>
  );
}
