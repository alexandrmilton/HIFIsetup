import Link from "next/link";
import type { Category, Setup } from "@/lib/types";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const relative = (iso: string | null) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "щойно";
  if (hours < 24) return `${hours} год тому`;
  return `${Math.floor(hours / 24)} дн тому`;
};

/** Desktop-only sidebar. Everything here links somewhere real — no mock UI. */
export function HomeSidebar({ isSignedIn, categories, setups }: { isSignedIn: boolean; categories: Category[]; setups: Setup[] }) {
  const counts = new Map<string, number>();
  for (const setup of setups) for (const name of setup.categories) counts.set(name, (counts.get(name) ?? 0) + 1);
  const top = categories
    .map((category) => ({ ...category, count: counts.get(category.name) ?? 0 }))
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const fresh = setups
    .filter((setup) => setup.updatedAt && Date.now() - new Date(setup.updatedAt).getTime() < WEEK)
    .slice(0, 4);

  return (
    <aside className="home-sidebar" aria-label="Бічна панель">
      <div className="side-card side-card-cta">
        <h3>Покажіть свій сетап</h3>
        <p>Три кроки: фото й опис, компоненти з каталогу, схема підключення. Після модерації сетап зʼявиться на головній.</p>
        <Link className="button button-dark side-cta" href={isSignedIn ? "/create" : "/login?next=/create"}>
          {isSignedIn ? "Створити сетап" : "Увійти та створити"} <span>→</span>
        </Link>
        {!isSignedIn && <small className="side-note">Для створення сетапу потрібен акаунт.</small>}
      </div>

      {fresh.length > 0 && (
        <div className="side-card">
          <h3>Свіжі оновлення</h3>
          <ul className="side-list">
            {fresh.map((setup) => (
              <li key={setup.slug}>
                <Link href={`/setups/${setup.slug}`}>{setup.title}</Link>
                <span>{relative(setup.updatedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </aside>
  );
}
