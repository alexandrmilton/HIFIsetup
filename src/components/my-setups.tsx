"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Setup } from "@/lib/types";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

function CopyButton({ slug, t }: { slug: string; t: Dictionary }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/setups/${slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return <button type="button" className="button button-outline button-small" onClick={copy}>{copied ? t.profile.copied : t.profile.share}</button>;
}

export function MySetups({ setups, t }: { setups: Setup[]; t: Dictionary }) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  const statusLabels = { pending: t.admin.statusPending, approved: t.admin.statusApproved, rejected: t.admin.statusRejected };

  async function remove(slug: string, title: string) {
    if (!confirm(format(t.admin.confirmDelete, { title }))) return;
    setBusy(slug);
    await fetch(`/api/setups/${slug}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  if (setups.length === 0) return <p className="empty-collection">{t.profile.noSetups} <Link className="text-link" href="/create">{t.profile.createFirst}</Link></p>;

  return (
    <ul className="my-setups">
      {setups.map((setup) => (
        <li className="my-setup" key={setup.slug}>
          {setup.coverUrl
            ? <img className="my-setup-thumb" src={setup.coverThumbUrl ?? setup.coverUrl} alt="" />
            : <span className="my-setup-thumb my-setup-thumb-empty" aria-hidden="true">🎵</span>}
          <div className="my-setup-body">
            <Link className="my-setup-title" href={`/setups/${setup.slug}`}>{setup.title}</Link>
            <p className="my-setup-pills">
              <span className={`status-pill status-pill-${setup.moderationStatus}`}>{statusLabels[setup.moderationStatus]}</span>
              <span className={setup.isPublished ? "visibility-pill public" : "visibility-pill private"}>{setup.isPublished ? t.profile.public : t.profile.private}</span>
              <span className="my-setup-meta">{setup.components.length} {t.card.components} · ♡ {setup.likeCount}</span>
            </p>
          </div>
          <div className="my-setup-actions">
            <Link className="button button-outline button-small" href={`/setups/${setup.slug}/edit`}>{t.profile.edit}</Link>
            <CopyButton slug={setup.slug} t={t} />
            <button className="button button-small danger-button" disabled={busy === setup.slug} onClick={() => remove(setup.slug, setup.title)}>{t.profile.delete}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
