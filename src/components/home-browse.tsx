"use client";

import { useState } from "react";
import { SetupCollection } from "@/components/setup-collection";
import { HomeSidebar } from "@/components/home-sidebar";
import type { Category, Setup } from "@/lib/types";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

/** Owns the active category so the sidebar links and the marquee chips drive
 *  the same filter — previously the sidebar only jumped to the anchor. */
export function HomeBrowse({ setups, categories, likedSlugs, isSignedIn, t, locale }: { setups: Setup[]; categories: Category[]; likedSlugs: string[]; isSignedIn: boolean; t: Dictionary; locale: Locale }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="home-layout shell">
      <div className="home-main">
        <SetupCollection setups={setups} categories={categories} likedSlugs={likedSlugs} isSignedIn={isSignedIn} t={t} locale={locale} active={active} onActiveChange={setActive} />
      </div>
      <HomeSidebar isSignedIn={isSignedIn} categories={categories} setups={setups} t={t} locale={locale} activeCategory={active} onSelectCategory={setActive} />
    </div>
  );
}
