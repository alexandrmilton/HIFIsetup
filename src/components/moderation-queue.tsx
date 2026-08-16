"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Setup } from "@/lib/types";

const statusLabels = { pending: "На модерації", approved: "Схвалено", rejected: "Відхилено" } as const;

export function ModerationQueue({ setups }: { setups: Setup[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  async function moderate(slug: string, status: "approved" | "rejected") {
    setBusy(slug);
    await fetch("/api/admin/moderate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, status }) });
    setBusy(null);
    router.refresh();
  }

  async function remove(slug: string, title: string) {
    if (!confirm(`Видалити сетап «${title}» назавжди? Цю дію не можна скасувати.`)) return;
    setBusy(slug);
    await fetch(`/api/setups/${slug}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (setups.length === 0) return <p className="empty-collection">Черга порожня.</p>;

  return (
    <ul className="moderation-list">
      {setups.map((setup) => (
        <li className={`moderation-item status-${setup.moderationStatus}`} key={setup.slug}>
          {setup.coverUrl
            ? <img className="moderation-thumb" src={setup.coverUrl} alt="" />
            : <span className="moderation-thumb moderation-thumb-empty" aria-hidden="true">🎵</span>}
          <div className="moderation-body">
            <Link className="moderation-title" href={`/setups/${setup.slug}`}>{setup.title}</Link>
            <p className="moderation-meta">
              <span className={`status-pill status-pill-${setup.moderationStatus}`}>{statusLabels[setup.moderationStatus]}</span>
              <span>{setup.owner}</span>
              <span>{setup.components.length} компоненти</span>
              <span>{setup.isPublished ? "Публічний" : "Приватний"}</span>
            </p>
          </div>
          <div className="moderation-actions">
            {setup.moderationStatus !== "approved" && <button className="button button-dark button-small" disabled={busy === setup.slug} onClick={() => moderate(setup.slug, "approved")}>Схвалити</button>}
            {setup.moderationStatus !== "rejected" && <button className="button button-outline button-small" disabled={busy === setup.slug} onClick={() => moderate(setup.slug, "rejected")}>Відхилити</button>}
            <button className="button button-small danger-button" disabled={busy === setup.slug} onClick={() => remove(setup.slug, setup.title)}>Видалити</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
