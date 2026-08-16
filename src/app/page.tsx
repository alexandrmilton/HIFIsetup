import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SetupCollection } from "@/components/setup-collection";
import { HomeSidebar } from "@/components/home-sidebar";
import { StatsStrip } from "@/components/stats-strip";
import { getPublishedSetups, getCategories, getSiteStats } from "@/lib/setups";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [setups, categories, stats, profile] = await Promise.all([getPublishedSetups(), getCategories(), getSiteStats(), getCurrentProfile()]);
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">Аудіо-сетапи, зібрані з любов’ю</p>
            <h1>Натхнення для вашого <em>ідеального звуку</em>.</h1>
            <p className="hero-lede">Досліджуйте реальні аудіо сетапи, діліться своїм та знаходьте нові ідеї.</p>
            <div className="hero-actions">
              <Link className="button button-dark" href="#setups">Досліджувати сетапи</Link>
              <Link className="button button-outline" href={profile ? "/create" : "/login?next=/create"}>Створити свій сетап</Link>
            </div>
          </div>
          <div className="hero-photo">
            <Image src="/setup-main.png" alt="Приклад Hi-Fi сетапу у вітальні" width={1536} height={1024} priority />
          </div>
        </section>

        <div className="home-layout shell">
          <div className="home-main">
            <SetupCollection setups={setups} categories={categories} />
          </div>
          <HomeSidebar isSignedIn={Boolean(profile)} categories={categories} setups={setups} />
        </div>

        <div className="shell"><StatsStrip stats={stats} /></div>
      </main>
      <SiteFooter />
    </>
  );
}
