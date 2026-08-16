import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/auth";
import { avatarUrl } from "@/lib/supabase/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function SiteHeader() {
  const [profile, t, locale] = await Promise.all([getCurrentProfile(), getDictionary(), getLocale()]);
  const initial = (profile?.displayName || profile?.email || "?").trim().charAt(0).toUpperCase();
  const avatar = avatarUrl(profile?.avatarPath);
  const isStaff = profile?.isAdmin || profile?.isModerator;

  return (
    <>
      <header className="site-header shell">
        <Link className="brand" href="/"><Image src="/logo.png" alt="HiFiSetup" width={2172} height={724} priority /></Link>
        <nav className="nav-links" aria-label={t.nav.setups}>
          <Link href="/">{t.nav.setups}</Link>
          <Link href="/create">{t.nav.create}</Link>
          <Link href="/about">{t.nav.about}</Link>
          <Link href="/#community">{t.nav.community}</Link>
          {isStaff && <Link href="/admin">{t.nav.moderation}</Link>}
        </nav>
        <div className="header-actions">
          <LanguageSwitcher locale={locale} t={t} />
          {profile
            ? <Link className="profile-icon" href="/profile" aria-label={t.nav.profile}>{avatar ? <img src={avatar} alt="" /> : <span>{initial}</span>}</Link>
            : <Link className="text-link" href="/login">{t.nav.signIn}</Link>}
          <Link className="button button-dark button-small" href={profile ? "/create" : "/login?next=/create"}>{t.nav.add}</Link>
        </div>
      </header>
      <nav className="mobile-nav" aria-label={t.nav.home}>
        <Link href="/"><b>⌂</b>{t.nav.home}</Link>
        <Link href={profile ? "/create" : "/login?next=/create"} className="mobile-add">＋<span>{t.nav.add}</span></Link>
        <Link href={profile ? "/profile" : "/login"}>{avatar ? <img className="mobile-avatar" src={avatar} alt="" /> : <b>{profile ? initial : "◯"}</b>}{t.nav.profile}</Link>
      </nav>
    </>
  );
}
