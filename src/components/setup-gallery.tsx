"use client";

import { useCallback, useEffect, useState } from "react";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

/** Thumbnails under the hero that open full size. The cover is included as the
 *  first slide so the lightbox shows the whole set, not just the extras. */
export function SetupGallery({ images, title, t }: { images: string[]; title: string; t: Dictionary }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (delta: number) => setOpen((current) => (current === null ? current : (current + delta + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll while the overlay is up.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, close, step]);

  if (images.length < 2) return null;

  return (
    <section className="setup-gallery">
      <p className="eyebrow">{t.gallery.heading}</p>
      <ul className="gallery-strip">
        {images.map((url, index) => (
          <li key={url}>
            <button type="button" className="gallery-thumb" onClick={() => setOpen(index)}>
              <img src={url} alt={`${title} — ${index + 1}`} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={t.gallery.heading} onClick={close}>
          <button type="button" className="lightbox-close" aria-label={t.gallery.close} onClick={close}>×</button>
          <button type="button" className="lightbox-nav prev" aria-label={t.gallery.prev} onClick={(event) => { event.stopPropagation(); step(-1); }}>‹</button>
          {/* Stop the click on the image itself from closing the overlay. */}
          <img className="lightbox-image" src={images[open]} alt={`${title} — ${open + 1}`} onClick={(event) => event.stopPropagation()} />
          <button type="button" className="lightbox-nav next" aria-label={t.gallery.next} onClick={(event) => { event.stopPropagation(); step(1); }}>›</button>
          <p className="lightbox-counter">{format(t.gallery.counter, { n: open + 1, total: images.length })}</p>
        </div>
      )}
    </section>
  );
}
