import Link from "next/link";
import type { Category, Setup } from "@/lib/types";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const relative = (iso: string | null, t: Dictionary) => {
  if (!iso) return "";
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return t.sidebar.justNow;
  if (hours < 24) return format(t.sidebar.hoursAgo, { n: hours });
  return format(t.sidebar.daysAgo, { n: Math.floor(hours / 24) });
};

/** Desktop-only sidebar. Everything here links somewhere real — no mock UI. */
export function HomeSidebar({ isSignedIn, categories, setups, t }: { isSignedIn: boolean; categories: Category[]; setups: Setup[]; t: Dictionary }) {
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
    <aside className="home-sidebar">
      <div className="side-card side-card-cta">
        <h3>{t.sidebar.ctaTitle}</h3>
        <p>{t.sidebar.ctaText}</p>
        <Link className="button button-dark side-cta" href={isSignedIn ? "/create" : "/login?next=/create"}>
          {isSignedIn ? t.sidebar.ctaButton : t.sidebar.ctaButtonGuest} <span>→</span>
        </Link>
        {!isSignedIn && <small className="side-note">{t.sidebar.ctaNote}</small>}
      </div>

      {fresh.length > 0 && (
        <div className="side-card">
          <h3>{t.sidebar.freshTitle}</h3>
          <ul className="side-list">
            {fresh.map((setup) => (
              <li key={setup.slug}>
                <Link href={`/setups/${setup.slug}`}>{setup.title}</Link>
                <span>{relative(setup.updatedAt, t)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {top.length > 0 && (
        <div className="side-card">
          <h3>{t.sidebar.popularTitle}</h3>
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
