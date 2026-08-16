"use client";

import { useMemo, useState } from "react";
import { SetupCard } from "@/components/setup-card";
import type { Category, Setup } from "@/lib/types";

export function SetupCollection({ setups, categories }: { setups: Setup[]; categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return setups
      .filter((setup) => (active ? setup.categories.includes(active) : true))
      .filter((setup) => !needle || `${setup.title} ${setup.owner}`.toLocaleLowerCase().includes(needle));
  }, [setups, active, query]);

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
          <div className="collection-search">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук за назвою або автором" aria-label="Пошук сетапів" />
            {active && <button className="text-link" onClick={() => setActive(null)}>Скинути фільтр</button>}
          </div>
        </div>
        {filtered.length > 0
          ? <div className="setup-grid">{filtered.map((setup) => <SetupCard key={setup.slug} setup={setup} />)}</div>
          : <p className="empty-collection">{query.trim() ? `Нічого не знайдено за запитом «${query.trim()}».` : "Поки немає сетапів у цій категорії."}</p>}
      </section>
    </>
  );
}
