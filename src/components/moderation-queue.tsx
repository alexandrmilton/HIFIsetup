"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Setup } from "@/lib/types";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

export function ModerationQueue({ setups, canDelete, t, searchable = false }: { setups: Setup[]; canDelete: boolean; t: Dictionary; searchable?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return setups;
    return setups.filter((setup) => `${setup.title} ${setup.owner}`.toLocaleLowerCase().includes(needle));
  }, [setups, query]);

  const statusLabels = { pending: t.admin.statusPending, approved: t.admin.statusApproved, rejected: t.admin.statusRejected };

  async function moderate(slug: string, status: "approved" | "rejected") {
    setBusy(slug);
    await fetch("/api/admin/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, status }) });
    setBusy(null);
    router.refresh();
  }

  async function remove(slug: string, title: string) {
    if (!confirm(format(t.admin.confirmDelete, { title }))) return;
    setBusy(slug);
    await fetch(`/api/setups/${slug}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (setups.length === 0) return <p className="empty-collection">{t.admin.emptyQueue}</p>;

  return (
    <>
      {searchable && (
        <input
          className="admin-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.admin.searchSetups}
          aria-label={t.admin.searchSetups}
        />
      )}
      {visible.length === 0
        ? <p className="empty-collection">{t.admin.noMatches}</p>
        : <ul className="moderation-list">
      {visible.map((setup) => (
        <li className={`moderation-item status-${setup.moderationStatus}`} key={setup.slug}>
          {setup.coverUrl
            ? <img className="moderation-thumb" src={setup.coverUrl} alt="" />
            : <span className="moderation-thumb moderation-thumb-empty" aria-hidden="true">🎵</span>}
          <div className="moderation-body">
            <Link className="moderation-title" href={`/setups/${setup.slug}`}>{setup.title}</Link>
            <p className="moderation-meta">
              <span className={`status-pill status-pill-${setup.moderationStatus}`}>{statusLabels[setup.moderationStatus]}</span>
              <span>{setup.owner}</span>
              <span>{setup.components.length} {t.card.components}</span>
              <span>{setup.isPublished ? t.profile.public : t.profile.private}</span>
            </p>
          </div>
          <div className="moderation-actions">
            {setup.moderationStatus !== "approved" && <button className="button button-dark button-small" disabled={busy === setup.slug} onClick={() => moderate(setup.slug, "approved")}>{t.admin.approve}</button>}
            {setup.moderationStatus !== "rejected" && <button className="button button-outline button-small" disabled={busy === setup.slug} onClick={() => moderate(setup.slug, "rejected")}>{t.admin.reject}</button>}
            {canDelete && <button className="button button-small danger-button" disabled={busy === setup.slug} onClick={() => remove(setup.slug, setup.title)}>{t.admin.delete}</button>}
          </div>
        </li>
      ))}
          </ul>}
    </>
  );
}
