import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/auth";
import { avatarUrl } from "@/lib/supabase/config";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getTheme } from "@/lib/theme-server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const [profile, t, locale, theme] = await Promise.all([getCurrentProfile(), getDictionary(), getLocale(), getTheme()]);
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
          {isStaff && (
            <Link className="nav-staff" href="/admin" aria-label={t.nav.moderation} title={t.nav.moderation}>
              <span className="nav-staff-full">{t.nav.moderation}</span>
              <span className="nav-staff-short" aria-hidden="true">{t.nav.moderationShort}</span>
            </Link>
          )}
          {profile?.isAdmin && (
            <Link className="nav-staff nav-staff-admin" href="/admin/stats" aria-label={t.nav.administration} title={t.nav.administration}>
              <span className="nav-staff-full">{t.nav.administration}</span>
              <span className="nav-staff-short" aria-hidden="true">{t.nav.administrationShort}</span>
            </Link>
          )}
          <ThemeToggle theme={theme} t={t} />
          <LanguageSwitcher locale={locale} t={t} />
          {profile
            ? <Link className="profile-icon" href="/profile" aria-label={t.nav.profile}>{avatar ? <img src={avatar} alt="" /> : <span>{initial}</span>}</Link>
            : <Link className="text-link header-signin" href="/login">{t.nav.signIn}</Link>}
          <Link className="button button-dark button-small header-add" href={createHref}>{t.nav.add}</Link>
        </div>
      </header>

      <nav className="mobile-nav" aria-label={t.nav.home}>
        <Link href="/"><b>⌂</b><span>{t.nav.setups}</span></Link>
        {/* An admin reaches the community block by scrolling the home page, but
            has no other route to the two staff pages on a phone — so the bar
            gives both of its side slots to them. */}
        {profile?.isAdmin
          ? <Link href="/admin/stats"><b>◧</b><span>{t.nav.administration}</span></Link>
          : <Link href="/#community"><b>◎</b><span>{t.nav.community}</span></Link>}
        {/* Centre slot: the primary action, lifted just enough to read as one. */}
        <Link className="mobile-create" href={createHref}><b>＋</b><span>{t.nav.create}</span></Link>
        {profile?.isAdmin
          ? <Link href="/admin"><b>◇</b><span>{t.nav.moderation}</span></Link>
          : <Link href="/about"><b>ⓘ</b><span>{t.nav.about}</span></Link>}
        <Link href={profile ? "/profile" : "/login"}>
          {avatar ? <img className="mobile-avatar" src={avatar} alt="" /> : <b>{profile ? initial : "◯"}</b>}
          <span>{t.nav.profile}</span>
        </Link>
      </nav>
    </>
  );
}
