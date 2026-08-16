"use client";

import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher({ locale, t }: { locale: Locale; t: Dictionary }) {
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    // One year, site-wide: the server reads this cookie on every request.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="lang-switch" role="group" aria-label={t.language.label}>
      {(["uk", "en"] as Locale[]).map((value) => (
        <button
          key={value}
          type="button"
          className={value === locale ? "lang-option active" : "lang-option"}
          onClick={() => choose(value)}
          aria-pressed={value === locale}
        >
          {t.language[value]}
        </button>
      ))}
    </div>
  );
}
