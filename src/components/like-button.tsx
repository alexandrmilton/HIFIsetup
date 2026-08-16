"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LikeButton({ slug, initialCount, initiallyLiked, isSignedIn }: { slug: string; initialCount: number; initiallyLiked: boolean; isSignedIn: boolean }) {
  const [liked, setLiked] = useState(initiallyLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!isSignedIn) { router.push(`/login?next=/setups/${slug}`); return; }
    setPending(true);
    const response = await fetch(`/api/setups/${slug}/like`, { method: liked ? "DELETE" : "POST" });
    setPending(false);
    if (!response.ok) return;
    const payload = await response.json();
    setLiked(payload.liked);
    setCount(payload.count);
  }

  return (
    <button type="button" className={liked ? "like-button liked" : "like-button"} onClick={toggle} disabled={pending} aria-pressed={liked}>
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span> {count}
    </button>
  );
}
