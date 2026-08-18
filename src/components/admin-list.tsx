"use client";

import { useMemo, useState } from "react";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

/** Rows rendered per page. The list body also scrolls internally, so the
 *  /admin page keeps a fixed height however far the catalogue grows. */
export const ADMIN_PAGE_SIZE = 25;

/** Search + capped rendering shared by every /admin list.
 *  `haystack` must be defined at module scope so its identity stays stable
 *  across renders and the memo actually memoises. */
export function useAdminList<T>(items: T[], haystack: (item: T) => string) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(ADMIN_PAGE_SIZE);

  const matched = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return items;
    return items.filter((item) => haystack(item).toLocaleLowerCase().includes(needle));
  }, [items, query, haystack]);

  return {
    query,
    // A new search starts from the top again, otherwise a wide earlier search
    // would leave the next one showing far more rows than a page.
    search: (value: string) => { setQuery(value); setLimit(ADMIN_PAGE_SIZE); },
    matched,
    visible: matched.slice(0, limit),
    showMore: () => setLimit((current) => current + ADMIN_PAGE_SIZE),
  };
}

export function AdminSearch({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <input
      className="admin-search"
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={label}
      aria-label={label}
    />
  );
}

/** Scrolling body plus the "showing X of Y" line and its Show more button. */
export function AdminListBody({ shown, total, onShowMore, t, children }: { shown: number; total: number; onShowMore: () => void; t: Dictionary; children: React.ReactNode }) {
  return (
    <>
      <div className="admin-scroll">
        {children}
        {shown < total && (
          <button type="button" className="button button-outline button-small admin-more" onClick={onShowMore}>
            {t.admin.showMore}
          </button>
        )}
      </div>
      <p className="admin-count">{format(t.admin.showing, { shown, total })}</p>
    </>
  );
}
