"use client";

import { useMemo, useState } from "react";
import { SetupCard } from "@/components/setup-card";
import type { Category, Setup } from "@/lib/types";

export function SetupCollection({ setups, categories }: { setups: Setup[]; categories: Category[] }) {
  const [active, setActive] = useState<string | null>(null);
  const filtered = useMemo(() => (active ? setups.filter((setup) => setup.categories.includes(active)) : setups), [setups, active]);

  return (
    <>
      <section className="filter-row shell" aria-label="Фільтри">
        <span className="filter-label">Знайти свій звук</span>
        <button className={active === null ? "filter-chip active" : "filter-chip"} onClick={() => setActive(null)}>Усі сетапи</button>
        {categories.map((category) => <button key={category.id} className={active === category.name ? "filter-chip active" : "filter-chip"} onClick={() => setActive(category.name)}>{category.name}</button>)}
      </section>
      <section className="collection shell" id="setups">
        <div className="section-heading"><div><p className="eyebrow">Свіжі сетапи</p><h2>Слухати очима</h2></div></div>
        {filtered.length > 0 ? <div className="setup-grid">{filtered.map((setup) => <SetupCard key={setup.slug} setup={setup} />)}</div> : <p className="empty-collection">Поки немає сетапів у цій категорії.</p>}
      </section>
    </>
  );
}
