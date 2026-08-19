"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { formatBytes } from "@/lib/format";

export function StoragePurge({ purgeableFiles, t }: { purgeableFiles: number; t: Dictionary }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  async function purge() {
    setBusy(true);
    setDone(null);
    const response = await fetch("/api/admin/storage", { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) { setDone(payload.error ?? t.errors.purgeFailed); return; }
    setDone(payload.removed
      ? format(t.adminStats.purged, { n: payload.removed, size: formatBytes(payload.bytes) })
      : t.adminStats.purgeNone);
    router.refresh();
  }

  return (
    <div className="purge-row">
      <button
        className="button button-small danger-button"
        onClick={purge}
        disabled={busy || purgeableFiles === 0}
      >
        {busy ? t.adminStats.purging : `${t.adminStats.purge} (${purgeableFiles})`}
      </button>
      {done && <span className="purge-result">{done}</span>}
    </div>
  );
}
