import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/site-header";
import { SetupCollection } from "@/components/setup-collection";
import { CreatePanels } from "@/components/create-panels";
import { getPublishedSetups, getCategories } from "@/lib/setups";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [setups, categories] = await Promise.all([getPublishedSetups(), getCategories()]);
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
              <Link className="button button-outline" href="/create">Створити свій сетап</Link>
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
          <CreatePanels />
        </div>
        <section className="callout shell"><div><p className="eyebrow">Ваш підпис у звуці</p><h2>Зібрали щось своє?</h2><p>Від першої платівки до системи, яку збирали роками. Покажіть її людям, що зрозуміють.</p></div><Link className="button button-light" href="/create">Створити сетап <span>↗</span></Link></section>
      </main>
    </>
  );
}
