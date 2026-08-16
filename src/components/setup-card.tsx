"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Setup } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

/** Freshly touched setups get a badge for a week after their last edit. */
const isFresh = (setup: Setup) => {
  if (!setup.updatedAt) return false;
  return Date.now() - new Date(setup.updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000;
};

function CardLike({ slug, count, liked, isSignedIn, t }: { slug: string; count: number; liked: boolean; isSignedIn: boolean; t: Dictionary }) {
  const [state, setState] = useState({ liked, count });
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle(event: React.MouseEvent) {
    // The card is a link; keep the click from navigating away.
    event.preventDefault();
    event.stopPropagation();
    if (!isSignedIn) { router.push(`/login?next=/setups/${slug}`); return; }
    setPending(true);
    const response = await fetch(`/api/setups/${slug}/like`, { method: state.liked ? "DELETE" : "POST" });
    setPending(false);
    if (!response.ok) return;
    const payload = await response.json();
    setState({ liked: payload.liked, count: payload.count });
  }

  return (
    <button type="button" className={state.liked ? "card-like liked" : "card-like"} onClick={toggle} disabled={pending} aria-pressed={state.liked} aria-label={state.liked ? t.card.unlike : t.card.like}>
      <span aria-hidden="true">{state.liked ? "♥" : "♡"}</span> {state.count}
    </button>
  );
}

function SetupCover({ setup, top, t }: { setup: Setup; top?: number; t: Dictionary }) {
  const badges = (
    <>
      {top !== undefined && <span className="cover-badge cover-top">🔥 {t.card.top} {top}</span>}
      {isFresh(setup) && top === undefined && <span className="cover-badge cover-fresh">{t.card.fresh}</span>}
      {!setup.isPublished && <span className="cover-badge cover-private">{t.card.private}</span>}
    </>
  );
  if (setup.coverUrl) return <div className="setup-cover" style={{ backgroundImage: `url(${setup.coverUrl})` }}>{badges}</div>;
  return (
    <div className="setup-cover setup-cover-empty" style={{ "--card-bg": setup.palette.background, "--wall": setup.palette.wall } as React.CSSProperties}>
      <div className="cover-wall" /><div className="cover-record" /><div className="cover-speaker left" /><div className="cover-speaker right" /><div className="cover-furniture" />{badges}
    </div>
  );
}

export function SetupCard({ setup, likedSlugs, isSignedIn, top, t }: { setup: Setup; likedSlugs: string[]; isSignedIn: boolean; top?: number; t: Dictionary }) {
  return (
    <div className={top !== undefined ? "setup-card is-top" : "setup-card"}>
      <Link className="setup-card-link" href={`/setups/${setup.slug}`}>
        <SetupCover setup={setup} top={top} t={t} />
      </Link>
      <div className="setup-meta">
        <div className="setup-title-line">
          <Link className="setup-title" href={`/setups/${setup.slug}`}>{setup.title}</Link>
          <CardLike slug={setup.slug} count={setup.likeCount} liked={likedSlugs.includes(setup.slug)} isSignedIn={isSignedIn} t={t} />
        </div>
        <p className="setup-owner">{setup.owner} · {setup.location} · {setup.components.length} {t.card.components}</p>
        {setup.categories.length > 0 && <div className="setup-tags">{setup.categories.slice(0, 3).map((name) => <span className="setup-tag" key={name}>{name}</span>)}</div>}
      </div>
    </div>
  );
}
