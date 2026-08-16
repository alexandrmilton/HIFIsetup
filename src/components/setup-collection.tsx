"use client";

import { useMemo, useState } from "react";
import { SetupCard } from "@/components/setup-card";
import type { Category, Setup } from "@/lib/types";

const TOP_COUNT = 3;

export function SetupCollection({ setups, categories, likedSlugs, isSignedIn }: { setups: Setup[]; categories: Category[]; likedSlugs: string[]; isSignedIn: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return setups
      .filter((setup) => (active ? setup.categories.includes(active) : true))
      .filter((setup) => !needle || `${setup.title} ${setup.owner}`.toLocaleLowerCase().includes(needle));
  }, [setups, active, query]);

  // Most-liked lead the page; the rest stay in recency order. Only show a top
  // row when nothing is filtered and the likes actually mean something.
  const showTop = !active && !query.trim();
  const top = useMemo(
    () => (showTop ? [...filtered].sort((a, b) => b.likeCount - a.likeCount).filter((setup) => setup.likeCount > 0).slice(0, TOP_COUNT) : []),
    [filtered, showTop],
  );
  const topSlugs = new Set(top.map((setup) => setup.slug));
  const rest = filtered.filter((setup) => !topSlugs.has(setup.slug));

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

      {top.length > 0 && (
        <section className="collection collection-top">
          <div className="section-heading">
            <div><p className="eyebrow">🔥 Найкраще</p><h2>Топ сетапи</h2></div>
          </div>
          <div className="setup-grid">
            {top.map((setup, index) => <SetupCard key={setup.slug} setup={setup} likedSlugs={likedSlugs} isSignedIn={isSignedIn} top={index + 1} />)}
          </div>
        </section>
      )}

      <section className="collection" id="setups">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{active ?? (showTop ? "Нові та оновлені" : "Результати")}</p>
            <h2>{showTop ? "Слухати очима" : "Знайдені сетапи"}</h2>
          </div>
          <div className="collection-search">
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Пошук за назвою або автором" aria-label="Пошук сетапів" />
            {active && <button className="text-link" onClick={() => setActive(null)}>Скинути</button>}
          </div>
        </div>
        {rest.length > 0
          ? <div className="setup-grid">{rest.map((setup) => <SetupCard key={setup.slug} setup={setup} likedSlugs={likedSlugs} isSignedIn={isSignedIn} />)}</div>
          : <p className="empty-collection">{query.trim() ? `Нічого не знайдено за запитом «${query.trim()}».` : active ? "Поки немає сетапів у цій категорії." : "Поки немає опублікованих сетапів."}</p>}
      </section>
    </>
  );
}
