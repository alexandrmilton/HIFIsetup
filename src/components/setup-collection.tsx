"use client";

import { useMemo, useState } from "react";
import { SetupCard } from "@/components/setup-card";
import type { Category, Setup } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const TOP_COUNT = 3;

export function SetupCollection({ setups, categories, likedSlugs, isSignedIn, t }: { setups: Setup[]; categories: Category[]; likedSlugs: string[]; isSignedIn: boolean; t: Dictionary }) {
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
      {/* Search sits above the Top row so it stays reachable without scrolling. */}
      <section className="browse-bar">
        <input
          className="browse-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.collection.searchPlaceholder}
          aria-label={t.collection.searchLabel}
        />
        {(active || query.trim()) && (
          <button className="browse-reset" onClick={() => { setActive(null); setQuery(""); }}>{t.collection.reset}</button>
        )}
      </section>

      <section className="tag-marquee" aria-label={t.collection.categories}>
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
            <div><p className="eyebrow">{t.collection.topEyebrow}</p><h2>{t.collection.topTitle}</h2></div>
          </div>
          <div className="setup-grid">
            {top.map((setup, index) => <SetupCard key={setup.slug} setup={setup} likedSlugs={likedSlugs} isSignedIn={isSignedIn} top={index + 1} t={t} />)}
          </div>
        </section>
      )}

      <section className="collection" id="setups">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{active ?? (showTop ? t.collection.freshEyebrow : t.collection.resultsEyebrow)}</p>
            <h2>{showTop ? t.collection.freshTitle : t.collection.resultsTitle}</h2>
          </div>
        </div>
        {rest.length > 0
          ? <div className="setup-grid">{rest.map((setup) => <SetupCard key={setup.slug} setup={setup} likedSlugs={likedSlugs} isSignedIn={isSignedIn} t={t} />)}</div>
          : <p className="empty-collection">{query.trim() ? t.collection.emptyQuery(query.trim()) : active ? t.collection.emptyCategory : t.collection.emptyAll}</p>}
      </section>
    </>
  );
}
