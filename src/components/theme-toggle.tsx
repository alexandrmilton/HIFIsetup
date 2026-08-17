"use client";

import { useRouter } from "next/navigation";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// The icon shows what tapping it *does*, not the current state: a moon on
// the light theme (tap to go dark), a sun on the dark theme (tap to go light).
function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.6 4.4l-1.4 1.4M5.8 14.2l-1.4 1.4M15.6 15.6l-1.4-1.4M5.8 5.8L4.4 4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17 11.5A7 7 0 1 1 8.5 3a5.5 5.5 0 0 0 8.5 8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function ThemeToggle({ theme, t }: { theme: Theme; t: Dictionary }) {
  const router = useRouter();

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    // One year, site-wide: the server reads this cookie on every request.
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={t.theme.label} aria-pressed={theme === "dark"} title={theme === "dark" ? t.theme.light : t.theme.dark}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
