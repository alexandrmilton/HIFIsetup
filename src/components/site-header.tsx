import Link from "next/link";

export function Logo() {
  return (
    <svg className="brand-mark" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="26" height="26" rx="7" fill="currentColor" />
      <rect x="5.5" y="11" width="2.6" height="4" rx="1.3" fill="var(--paper)" />
      <rect x="9.9" y="7.5" width="2.6" height="11" rx="1.3" fill="var(--paper)" />
      <rect x="14.3" y="4.5" width="2.6" height="17" rx="1.3" fill="var(--paper)" />
      <rect x="18.7" y="9" width="2.6" height="8" rx="1.3" fill="var(--paper)" />
    </svg>
  );
}

export function SiteHeader() {
  return <><header className="site-header shell"><Link className="brand" href="/"><Logo />HiFiSetups</Link><nav className="nav-links" aria-label="Головна навігація"><Link href="/">Сетапи</Link><Link href="/create">Створити</Link><a href="#about">Про проєкт</a></nav><div className="header-actions"><Link className="text-link" href="/login">Увійти</Link><Link className="button button-dark button-small" href="/create">Додати</Link></div></header><nav className="mobile-nav" aria-label="Мобільна навігація"><Link href="/"><b>⌂</b>Головна</Link><Link href="/create" className="mobile-add">＋<span>Додати</span></Link><Link href="/login"><b>◯</b>Профіль</Link></nav></>;
}
