"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Setup } from "@/lib/types";

const statusLabels = { pending: "На модерації", approved: "Схвалено", rejected: "Відхилено" } as const;

function CopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/setups/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return <button type="button" className="button button-outline button-small" onClick={copy}>{copied ? "Скопійовано ✓" : "Поділитися"}</button>;
}

export function MySetups({ setups }: { setups: Setup[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  async function remove(slug: string, title: string) {
    if (!confirm(`Видалити сетап «${title}»? Цю дію не можна скасувати.`)) return;
    setBusy(slug);
    await fetch(`/api/setups/${slug}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (setups.length === 0) return <p className="empty-collection">Ви ще не створили жодного сетапу. <Link className="text-link" href="/create">Створити перший</Link></p>;

  return (
    <ul className="my-setups">
      {setups.map((setup) => (
        <li className="my-setup" key={setup.slug}>
          {setup.coverUrl
            ? <img className="my-setup-thumb" src={setup.coverUrl} alt="" />
            : <span className="my-setup-thumb my-setup-thumb-empty" aria-hidden="true">🎵</span>}
          <div className="my-setup-body">
            <Link className="my-setup-title" href={`/setups/${setup.slug}`}>{setup.title}</Link>
            <p className="my-setup-pills">
              <span className={`status-pill status-pill-${setup.moderationStatus}`}>{statusLabels[setup.moderationStatus]}</span>
              <span className={setup.isPublished ? "visibility-pill public" : "visibility-pill private"}>{setup.isPublished ? "Публічний" : "Приватний"}</span>
              <span className="my-setup-meta">{setup.components.length} комп. · ♡ {setup.likeCount}</span>
            </p>
          </div>
          <div className="my-setup-actions">
            <Link className="button button-outline button-small" href={`/setups/${setup.slug}/edit`}>Редагувати</Link>
            <CopyButton slug={setup.slug} />
            <button className="button button-small danger-button" disabled={busy === setup.slug} onClick={() => remove(setup.slug, setup.title)}>Видалити</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
