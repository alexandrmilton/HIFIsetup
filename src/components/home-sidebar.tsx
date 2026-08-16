import Link from "next/link";
import type { Category, Setup } from "@/lib/types";

/** Desktop-only sidebar. Everything here links somewhere real — no mock UI. */
export function HomeSidebar({ isSignedIn, categories, setups }: { isSignedIn: boolean; categories: Category[]; setups: Setup[] }) {
  const counts = new Map<string, number>();
  for (const setup of setups) for (const name of setup.categories) counts.set(name, (counts.get(name) ?? 0) + 1);
  const top = categories
    .map((category) => ({ ...category, count: counts.get(category.name) ?? 0 }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const mostLiked = [...setups].sort((a, b) => b.likeCount - a.likeCount).filter((setup) => setup.likeCount > 0).slice(0, 3);

  return (
    <aside className="home-sidebar" aria-label="Бічна панель">
      <div className="side-card side-card-cta">
        <h3>Покажіть свій сетап</h3>
        <p>Три кроки: фото й опис, компоненти з каталогу, схема підключення.</p>
        <Link className="button button-dark side-cta" href={isSignedIn ? "/create" : "/login?next=/create"}>
          {isSignedIn ? "Створити сетап" : "Увійти та створити"} <span>→</span>
        </Link>
        {!isSignedIn && <small className="side-note">Для створення сетапу потрібен акаунт.</small>}
      </div>

      {top.length > 0 && (
        <div className="side-card">
          <h3>Популярні напрямки</h3>
          <ul className="side-list">
            {top.map((category) => (
              <li key={category.id}><Link href="#setups">{category.name}</Link><span>{category.count}</span></li>
            ))}
          </ul>
        </div>
      )}

      {mostLiked.length > 0 && (
        <div className="side-card">
          <h3>Найбільше вподобань</h3>
          <ul className="side-list">
            {mostLiked.map((setup) => (
              <li key={setup.slug}><Link href={`/setups/${setup.slug}`}>{setup.title}</Link><span>♡ {setup.likeCount}</span></li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
