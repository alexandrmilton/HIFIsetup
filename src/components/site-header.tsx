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
  const createHref = profile ? "/create" : "/login?next=/create";

  return (
    <>
      <header className="site-header shell">
        <Link className="brand" href="/"><Image src="/logo.png" alt="HiFiSetup" width={2172} height={724} priority /></Link>
        <nav className="nav-links" aria-label={t.nav.setups}>
          <Link href="/">{t.nav.setups}</Link>
          <Link href={createHref}>{t.nav.create}</Link>
          <Link href="/#community">{t.nav.community}</Link>
          <Link href="/about">{t.nav.about}</Link>
        </nav>
        <div className="header-actions">
          {/* Staff tool rather than a public page, so it sits in the actions
              cluster — which also keeps it visible on mobile, where nav-links
              is hidden and the public links move to the bottom bar. */}
          {isStaff && <Link className="nav-staff" href="/admin">{t.nav.moderation}</Link>}
          <LanguageSwitcher locale={locale} t={t} />
          {profile
            ? <Link className="profile-icon" href="/profile" aria-label={t.nav.profile}>{avatar ? <img src={avatar} alt="" /> : <span>{initial}</span>}</Link>
            : <Link className="text-link header-signin" href="/login">{t.nav.signIn}</Link>}
          <Link className="button button-dark button-small header-add" href={createHref}>{t.nav.add}</Link>
        </div>
      </header>

      <nav className="mobile-nav" aria-label={t.nav.home}>
        <Link href="/"><b>⌂</b>{t.nav.setups}</Link>
        <Link href={createHref}><b>＋</b>{t.nav.create}</Link>
        <Link href="/#community"><b>◎</b>{t.nav.community}</Link>
        <Link href="/about"><b>ⓘ</b>{t.nav.about}</Link>
        <Link href={profile ? "/profile" : "/login"}>
          {avatar ? <img className="mobile-avatar" src={avatar} alt="" /> : <b>{profile ? initial : "◯"}</b>}
          {t.nav.profile}
        </Link>
      </nav>
    </>
  );
}
