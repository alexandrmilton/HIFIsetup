"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OriginBadge } from "@/components/origin-badge";
import { componentMeta } from "@/lib/component-meta";
import { translateComponentCategory } from "@/lib/category-i18n";
import { format, type Dictionary, type Locale } from "@/lib/i18n/dictionaries";
import type { ComponentOrigin } from "@/lib/types";

export type UserComponent = {
  id: string;
  brand: string;
  model: string;
  category: string;
  origin: ComponentOrigin;
  created_at: string;
  submitted_by: string | null;
  submitter_name: string | null;
  setups: { slug: string; title: string }[];
};

export function UserComponents({ components, t, locale }: { components: UserComponent[]; t: Dictionary; locale: Locale }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return components;
    return components.filter((component) =>
      `${component.brand} ${component.model} ${component.category} ${component.submitter_name ?? ""}`
        .toLocaleLowerCase()
        .includes(needle),
    );
  }, [components, query]);

  async function remove(component: UserComponent) {
    const name = `${component.brand} ${component.model}`;
    if (!confirm(format(t.admin.confirmDeleteComponent, { name, count: component.setups.length }))) return;
    setBusy(component.id);
    await fetch(`/api/admin/components?id=${encodeURIComponent(component.id)}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (components.length === 0) return <p className="empty-collection">{t.admin.noUserComponents}</p>;

  return (
    <>
      <input
        className="admin-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.admin.searchComponents}
        aria-label={t.admin.searchComponents}
      />
      {visible.length === 0
        ? <p className="empty-collection">{t.admin.noMatches}</p>
        : (
          <ul className="member-list">
            {visible.map((component) => (
              <li className="member-item" key={component.id}>
                <span className="component-icon" aria-hidden="true">{componentMeta(component.category).icon}</span>
                <div className="member-body">
                  <strong>{component.brand} {component.model}</strong>
                  <p className="member-meta">
                    <span>{translateComponentCategory(component.category, locale)}</span>
                    <OriginBadge origin={component.origin} t={t} />
                    <span>{t.admin.addedBy}: {component.submitter_name ?? t.admin.noName}</span>
                    <span>{new Date(component.created_at).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB")}</span>
                  </p>
                  <p className="member-meta">
                    {component.setups.length === 0
                      ? <span>{t.admin.usedInNone}</span>
                      : (
                        <>
                          <span>{t.admin.usedIn}:</span>
                          {component.setups.map((setup) => (
                            <Link className="component-setup-link" key={setup.slug} href={`/setups/${setup.slug}`}>{setup.title}</Link>
                          ))}
                        </>
                      )}
                  </p>
                </div>
                <button
                  className="button button-small danger-button"
                  disabled={busy === component.id}
                  onClick={() => remove(component)}
                >
                  {t.admin.delete}
                </button>
              </li>
            ))}
          </ul>
        )}
    </>
  );
}
