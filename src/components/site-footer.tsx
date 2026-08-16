import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "@/lib/i18n/server";

const TELEGRAM_INVITE = "https://t.me/+ZMM9P_56MPw4Mzgy";

export async function SiteFooter() {
  const t = await getDictionary();

  return (
    <footer className="site-footer">
      <div className="shell footer-community" id="community">
        <div>
          <p className="eyebrow">{t.footer.communityEyebrow}</p>
          <h3>{t.footer.communityTitleLead} <strong>Меломанія_UA</strong></h3>
          <p>{t.footer.communityText}</p>
        </div>
        <a className="button button-dark" href={TELEGRAM_INVITE} target="_blank" rel="noreferrer">{t.footer.join} <span>↗</span></a>
      </div>

      <div className="shell footer-inner">
        <div className="footer-brand">
          <Image src="/logo.png" alt="HiFiSetup" width={2172} height={724} />
          <p>{t.footer.brandText}</p>
        </div>
        <nav className="footer-links" aria-label={t.footer.nav}>
          <div>
            <h4>{t.footer.siteHeading}</h4>
            <Link href="/">{t.nav.home}</Link>
            <Link href="/#setups">{t.nav.setups}</Link>
            <Link href="/create">{t.hero.createOwn}</Link>
          </div>
          <div>
            <h4>{t.footer.communityHeading}</h4>
            <a href={TELEGRAM_INVITE} target="_blank" rel="noreferrer">{t.footer.telegram}</a>
            <a href="/api/public/setups">{t.footer.api}</a>
            <a href="https://github.com/alexandrmilton/HIFIsetup" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </nav>
      </div>

      <div className="shell footer-bottom">
        <p>{t.footer.copyright}</p>
        <p className="footer-note">{t.footer.note}</p>
      </div>
    </footer>
  );
}
