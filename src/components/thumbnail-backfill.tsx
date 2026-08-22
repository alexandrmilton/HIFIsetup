"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { compressImage, makeThumbnail } from "@/lib/image";
import { coverUrl, PHOTO_PREFIX, THUMB_PREFIX } from "@/lib/supabase/config";

type Legacy = { path: string; bytes: number };

/** Photos uploaded before thumbnails existed have no small copy, so cards still
 *  download the full image for them. Re-encoding one needs a canvas, so this
 *  runs in the admin's browser: fetch the original, write both copies under the
 *  `photos/` prefix, then point the rows at the new path.
 *
 *  The order matters. Nothing is repointed until both copies are stored, so a
 *  failure part-way leaves the setup on its old path — still rendering, just
 *  without a thumbnail. The abandoned uploads become orphans, which the purge
 *  above sweeps. The one thing never to do is repoint to a `photos/` path whose
 *  thumbnail is missing: every card would then ask for a file that is not there. */
export function ThumbnailBackfill({ legacyFiles, t }: { legacyFiles: number; t: Dictionary }) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();

  async function backfill() {
    setBusy(true);
    setDone(null);
    setProgress(null);
    const supabase = createClient();

    const { data, error } = await supabase.rpc("list_legacy_photos");
    if (error) {
      setBusy(false);
      setDone(error.message.includes("not authorised") ? t.errors.forbidden : t.adminStats.backfillFailed);
      return;
    }

    const legacy = (data as Legacy[] | null) ?? [];
    if (legacy.length === 0) {
      setBusy(false);
      setDone(t.adminStats.backfillNone);
      return;
    }

    let converted = 0;
    let failed = 0;
    for (const [index, photo] of legacy.entries()) {
      setProgress(format(t.adminStats.backfillProgress, { n: index + 1, total: legacy.length }));
      try {
        const source = coverUrl(photo.path);
        if (!source) throw new Error("no-url");
        const blob = await fetch(source).then((response) => {
          if (!response.ok) throw new Error("fetch-failed");
          return response.blob();
        });
        const original = photo.path.slice(photo.path.lastIndexOf("/") + 1);
        const ready = await compressImage(new File([blob], original, { type: blob.type }));
        const thumb = await makeThumbnail(ready);
        if (!thumb) throw new Error("thumb-failed");

        const extension = ready.type === "image/webp" ? "webp" : ready.type === "image/png" ? "png" : "jpg";
        const name = original.replace(/\.[^.]+$/, "") + "." + extension;

        const full = await supabase.storage.from("setup-images").upload(`${PHOTO_PREFIX}${name}`, ready, { upsert: true, contentType: ready.type });
        if (full.error) throw full.error;
        const small = await supabase.storage.from("setup-images").upload(`${THUMB_PREFIX}${name}`, thumb, { upsert: true, contentType: thumb.type });
        if (small.error) throw small.error;

        const repoint = await supabase.rpc("repoint_photo", { p_old: photo.path, p_new: `${PHOTO_PREFIX}${name}` });
        if (repoint.error) throw repoint.error;

        // Nothing points at the original any more, so retire it here rather
        // than leaving a sweep to notice it later.
        await supabase.storage.from("setup-images").remove([photo.path]);
        converted += 1;
      } catch {
        failed += 1;
      }
    }

    setBusy(false);
    setProgress(null);
    setDone(failed
      ? format(t.adminStats.backfillPartial, { n: converted, failed })
      : format(t.adminStats.backfilled, { n: converted }));
    router.refresh();
  }

  return (
    <div className="purge-row">
      <button className="button button-small" onClick={backfill} disabled={busy || legacyFiles === 0}>
        {busy ? t.adminStats.backfilling : `${t.adminStats.backfill} (${legacyFiles})`}
      </button>
      {(progress || done) && <span className="purge-result">{progress ?? done}</span>}
    </div>
  );
}
