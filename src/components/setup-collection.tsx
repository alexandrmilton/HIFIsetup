"use client";

import { useMemo, useState } from "react";
import { SetupCard } from "@/components/setup-card";
import type { Category, Setup } from "@/lib/types";

export function SetupCollection({ setups, categories }: { setups: Setup[]; categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = useMemo(() => (active ? setups.filter((setup) => setup.categories.includes(active)) : setups), [setups, active]);
  // The track is rendered twice so the CSS marquee can loop seamlessly.
  const track = [...categories, ...categories];

  return (
    <>
      <section className="tag-marquee" aria-label="Категорії">
        <div className={active ? "tag-track paused" : "tag-track"}>
          {track.map((category, index) => (
            <button
              key={`${category.id}-${index}`}
              className={active === category.name ? "tag-pill active" : "tag-pill"}
              onClick={() => setActive(active === category.name ? null : category.name)}
              aria-hidden={index >= categories.length}
              tabIndex={index >= categories.length ? -1 : 0}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="collection" id="setups">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{active ?? "Свіжі сетапи"}</p>
            <h2>Слухати очима</h2>
          </div>
          {active && <button className="text-link" onClick={() => setActive(null)}>Показати всі <span>×</span></button>}
        </div>
        {filtered.length > 0
          ? <div className="setup-grid">{filtered.map((setup) => <SetupCard key={setup.slug} setup={setup} />)}</div>
          : <p className="empty-collection">Поки немає сетапів у цій категорії.</p>}
      </section>
    </>
  );
}
