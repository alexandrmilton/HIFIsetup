import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SetupCollection } from "@/components/setup-collection";
import { HomeSidebar } from "@/components/home-sidebar";
import { StatsStrip } from "@/components/stats-strip";
import { getPublishedSetups, getCategories, getSiteStats } from "@/lib/setups";
import { getCurrentProfile, getLikedSlugs } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [setups, categories, stats, profile, likedSlugs, t] = await Promise.all([
    getPublishedSetups(), getCategories(), getSiteStats(), getCurrentProfile(), getLikedSlugs(), getDictionary(),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">{t.hero.eyebrow}</p>
            <h1>{t.hero.titleLead} <em>{t.hero.titleAccent}</em>.</h1>
            <p className="hero-lede">{t.hero.lede}</p>
            <div className="hero-actions">
              <Link className="button button-dark" href="#setups">{t.hero.explore}</Link>
              <Link className="button button-outline" href={profile ? "/create" : "/login?next=/create"}>{t.hero.createOwn}</Link>
            </div>
          </div>
          <div className="hero-photo">
            <Image src="/setup-main.png" alt={t.hero.photoAlt} width={1536} height={1024} priority />
          </div>
        </section>

        <div className="home-layout shell">
          <div className="home-main">
            <SetupCollection setups={setups} categories={categories} likedSlugs={likedSlugs} isSignedIn={Boolean(profile)} t={t} />
          </div>
          <HomeSidebar isSignedIn={Boolean(profile)} categories={categories} setups={setups} t={t} />
        </div>

        <div className="shell"><StatsStrip stats={stats} t={t} /></div>
      </main>
      <SiteFooter />
    </>
  );
}
