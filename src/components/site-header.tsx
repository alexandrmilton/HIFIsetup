import Link from "next/link";
import Image from "next/image";

export function SiteHeader() {
  return <><header className="site-header shell"><Link className="brand" href="/"><Image src="/logo.png" alt="HiFiSetup" width={2172} height={724} priority /></Link><nav className="nav-links" aria-label="Головна навігація"><Link href="/">Сетапи</Link><Link href="/create">Створити</Link><a href="#about">Про проєкт</a></nav><div className="header-actions"><Link className="text-link" href="/login">Увійти</Link><Link className="button button-dark button-small" href="/create">Додати</Link></div></header><nav className="mobile-nav" aria-label="Мобільна навігація"><Link href="/"><b>⌂</b>Головна</Link><Link href="/create" className="mobile-add">＋<span>Додати</span></Link><Link href="/login"><b>◯</b>Профіль</Link></nav></>;
}
