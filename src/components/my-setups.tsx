"use client";

import Link from "next/link";
import { useState } from "react";
import type { Setup } from "@/lib/types";

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
            <p>
              <span className={setup.isPublished ? "visibility-pill public" : "visibility-pill private"}>{setup.isPublished ? "Публічний" : "Приватний"}</span>
              <span className="my-setup-meta">{setup.components.length} компоненти · ♡ {setup.likeCount}</span>
            </p>
          </div>
          <CopyButton slug={setup.slug} />
        </li>
      ))}
    </ul>
  );
}
