"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SetupComment } from "@/lib/types";
import { avatarUrl } from "@/lib/supabase/config";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });

export function Comments({ slug, initial, currentUserId, isAdmin }: { slug: string; initial: SetupComment[]; currentUserId: string | null; isAdmin: boolean }) {
  const [comments, setComments] = useState(initial);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/setups/${slug}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    setPending(false);
    if (!response.ok) { setError((await response.json()).error ?? "Не вдалося зберегти коментар."); return; }
    setBody("");
    router.refresh();
    const { comment } = await response.json();
    setComments((current) => [{ id: comment.id, body: comment.body, createdAt: comment.created_at, authorId: currentUserId!, authorName: "Ви", authorAvatar: null }, ...current]);
  }

  async function remove(id: string) {
    const response = await fetch(`/api/setups/${slug}/comments?id=${id}`, { method: "DELETE" });
    if (response.ok) setComments((current) => current.filter((comment) => comment.id !== id));
  }

  return (
    <section className="comments">
      <p className="eyebrow">Коментарі {comments.length > 0 && `· ${comments.length}`}</p>

      {currentUserId ? (
        <form className="comment-form" onSubmit={submit}>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Що думаєте про цей сетап?" maxLength={2000} rows={3} />
          {error && <p className="form-error">{error}</p>}
          <button className="button button-dark button-small" type="submit" disabled={pending || !body.trim()}>{pending ? "Надсилаємо…" : "Залишити коментар"}</button>
        </form>
      ) : (
        <p className="comment-signin">
          <Link className="text-link" href={`/login?next=/setups/${slug}`}>Увійдіть</Link>, щоб залишити коментар.
        </p>
      )}

      {comments.length === 0
        ? <p className="empty-collection">Коментарів ще немає — будьте першим.</p>
        : (
          <ul className="comment-list">
            {comments.map((comment) => {
              const avatar = avatarUrl(comment.authorAvatar);
              const initial = (comment.authorName || "?").charAt(0).toUpperCase();
              return (
                <li className="comment" key={comment.id}>
                  {avatar ? <img className="comment-avatar" src={avatar} alt="" /> : <span className="comment-avatar comment-avatar-empty">{initial}</span>}
                  <div className="comment-body">
                    <p className="comment-meta"><strong>{comment.authorName ?? "Слухач"}</strong><span>{formatDate(comment.createdAt)}</span></p>
                    <p className="comment-text">{comment.body}</p>
                  </div>
                  {(comment.authorId === currentUserId || isAdmin) && (
                    <button type="button" className="comment-delete" onClick={() => remove(comment.id)} aria-label="Видалити коментар">×</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </section>
  );
}
