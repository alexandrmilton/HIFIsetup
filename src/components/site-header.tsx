import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/auth";
import { avatarUrl } from "@/lib/supabase/config";

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const initial = (profile?.displayName || profile?.email || "?").trim().charAt(0).toUpperCase();
  const avatar = avatarUrl(profile?.avatarPath);

  const profileIcon = profile ? (
    <Link className="profile-icon" href="/profile" aria-label="Профіль">
      {avatar ? <img src={avatar} alt="" /> : <span>{initial}</span>}
    </Link>
  ) : (
    <Link className="text-link" href="/login">Увійти</Link>
  );

  return (
    <>
      <header className="site-header shell">
        <Link className="brand" href="/"><Image src="/logo.png" alt="HiFiSetup" width={2172} height={724} priority /></Link>
        <nav className="nav-links" aria-label="Головна навігація"><Link href="/">Сетапи</Link><Link href="/create">Створити</Link><a href="#about">Про проєкт</a></nav>
        <div className="header-actions">{profileIcon}<Link className="button button-dark button-small" href="/create">Додати</Link></div>
      </header>
      <nav className="mobile-nav" aria-label="Мобільна навігація">
        <Link href="/"><b>⌂</b>Головна</Link>
        <Link href="/create" className="mobile-add">＋<span>Додати</span></Link>
        <Link href={profile ? "/profile" : "/login"}>{avatar ? <img className="mobile-avatar" src={avatar} alt="" /> : <b>{profile ? initial : "◯"}</b>}Профіль</Link>
      </nav>
    </>
  );
}
