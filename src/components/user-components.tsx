"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminListBody, AdminSearch, useAdminList } from "@/components/admin-list";
import { OriginBadge } from "@/components/origin-badge";
import { CATEGORY_GROUPS, componentMeta } from "@/lib/component-meta";
import { translateComponentCategory, translateGroupLabel } from "@/lib/category-i18n";
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

type Draft = { brand: string; model: string; category: string; origin: ComponentOrigin };

const haystack = (component: UserComponent) =>
  `${component.brand} ${component.model} ${component.category} ${component.submitter_name ?? ""}`;

function EditRow({ component, t, locale, onCancel, onSaved }: { component: UserComponent; t: Dictionary; locale: Locale; onCancel: () => void; onSaved: () => void }) {
  const [draft, setDraft] = useState<Draft>({
    brand: component.brand, model: component.model, category: component.category, origin: component.origin,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/components", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: component.id, ...draft }),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error ?? t.errors.componentUpdateFailed);
      return;
    }
    onSaved();
  }

  const unchanged =
    draft.brand.trim() === component.brand && draft.model.trim() === component.model
    && draft.category === component.category && draft.origin === component.origin;

  return (
    <li className="member-item component-edit">
      <div className="component-edit-body">
        <div className="two-fields">
          <div className="field">
            <label htmlFor={`brand-${component.id}`}>{t.picker.brand}</label>
            <input id={`brand-${component.id}`} value={draft.brand} onChange={(event) => setDraft({ ...draft, brand: event.target.value })} />
          </div>
          <div className="field">
            <label htmlFor={`model-${component.id}`}>{t.picker.model}</label>
            <input id={`model-${component.id}`} value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
          </div>
        </div>
        <div className="field">
          <label htmlFor={`category-${component.id}`}>{t.picker.category}</label>
          <select id={`category-${component.id}`} value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
            {CATEGORY_GROUPS.map((group) => (
              <optgroup key={group.label} label={translateGroupLabel(group.label, locale)}>
                {group.categories.map((category) => <option key={category} value={category}>{translateComponentCategory(category, locale)}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="field">
          <label>{t.picker.origin}</label>
          <div className="type-options">
            {(["standard", "handmade", "custom_order"] as ComponentOrigin[]).map((origin) => (
              <button
                key={origin}
                type="button"
                className={`type-option type-option-${origin} ${draft.origin === origin ? "active" : ""}`}
                onClick={() => setDraft({ ...draft, origin })}
              >
                {origin === "standard" ? t.picker.standard : origin === "handmade" ? t.picker.handmade : t.picker.custom}
              </button>
            ))}
          </div>
        </div>
        <p className="field-hint">{t.admin.editComponentHint}</p>
        {error && <p className="form-error">{error}</p>}
        <div className="component-edit-actions">
          <button className="button button-dark button-small" disabled={saving || unchanged || !draft.brand.trim() || !draft.model.trim()} onClick={save}>
            {t.admin.save}
          </button>
          <button className="button button-outline button-small" disabled={saving} onClick={onCancel}>{t.admin.cancel}</button>
        </div>
      </div>
    </li>
  );
}

export function UserComponents({ components, t, locale }: { components: UserComponent[]; t: Dictionary; locale: Locale }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const router = useRouter();
  const list = useAdminList(components, haystack);

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
      <AdminSearch value={list.query} onChange={list.search} label={t.admin.searchComponents} />
      {list.matched.length === 0
        ? <p className="empty-collection">{t.admin.noMatches}</p>
        : (
          <AdminListBody shown={list.visible.length} total={list.matched.length} onShowMore={list.showMore} t={t}>
            <ul className="member-list">
              {list.visible.map((component) => (
                editing === component.id
                  ? (
                    <EditRow
                      key={component.id}
                      component={component}
                      t={t}
                      locale={locale}
                      onCancel={() => setEditing(null)}
                      onSaved={() => { setEditing(null); router.refresh(); }}
                    />
                  )
                  : (
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
                      <div className="moderation-actions">
                        <button className="button button-outline button-small" onClick={() => setEditing(component.id)}>{t.admin.edit}</button>
                        <button className="button button-small danger-button" disabled={busy === component.id} onClick={() => remove(component)}>{t.admin.delete}</button>
                      </div>
                    </li>
                  )
              ))}
            </ul>
          </AdminListBody>
        )}
    </>
  );
}
