import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";

const TELEGRAM_INVITE = "https://t.me/+ZMM9P_56MPw4Mzgy";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: `${t.about.title} — HiFiSetup`, description: t.about.lede };
}

export default async function AboutPage() {
  const [t, profile] = await Promise.all([getDictionary(), getCurrentProfile()]);

  return (
    <>
      <SiteHeader />
      <main className="page-main shell about-page">
        <div className="page-head">
          <p className="eyebrow">{t.about.eyebrow}</p>
          <h1>{t.about.title}</h1>
          <p>{t.about.lede}</p>
        </div>

        <section className="about-block">
          <h2>{t.about.whyTitle}</h2>
          <p>{t.about.whyText}</p>
        </section>

        <section className="about-block">
          <h2>{t.about.shareTitle}</h2>
          <ul className="about-list">
            <li><span aria-hidden="true">🎧</span>{t.about.shareOne}</li>
            <li><span aria-hidden="true">🔍</span>{t.about.shareTwo}</li>
            <li><span aria-hidden="true">🔗</span>{t.about.shareThree}</li>
            <li><span aria-hidden="true">➕</span>{t.about.shareFour}</li>
          </ul>
        </section>

        <section className="about-block">
          <h2>{t.about.moderationTitle}</h2>
          <p>{t.about.moderationText}</p>
        </section>

        <section className="about-cta">
          <div>
            <p className="eyebrow">{t.about.communityTitle}</p>
            <h2>{t.about.communityText}</h2>
          </div>
          <div className="about-cta-actions">
            <a className="button button-dark" href={TELEGRAM_INVITE} target="_blank" rel="noreferrer">{t.footer.join} <span>↗</span></a>
            <Link className="button button-outline" href={profile ? "/create" : "/login?next=/create"}>{t.about.cta}</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
