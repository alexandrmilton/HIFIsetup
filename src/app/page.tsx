import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SetupCollection } from "@/components/setup-collection";
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
            <h1>Місце, де ваша музика <em>має вигляд</em>.</h1>
            <p className="hero-lede">Досліджуйте кімнати, компоненти й особисті історії слухання. Без шуму — лише хороші системи.</p>
            <div className="hero-actions"><Link className="button button-dark" href="/create">Додати свій сетап <span>↗</span></Link><a className="text-link" href="#setups">Дивитися добірку <span>↓</span></a></div>
          </div>
          <div className="hero-art" aria-label="Ілюстрація аудіо-сетапу"><div className="sun-disc" /><div className="shelf"><i /><i /><i /></div><div className="speaker speaker-left"><b /><b /></div><div className="speaker speaker-right"><b /><b /></div><div className="amp"><span>80</span><i /><i /><i /></div><div className="record" /><p>Звук як простір</p></div>
        </section>
        <SetupCollection setups={setups} categories={categories} />
        <section className="callout shell"><div><p className="eyebrow">Ваш підпис у звуці</p><h2>Зібрали щось своє?</h2><p>Від першої платівки до системи, яку збирали роками. Покажіть її людям, що зрозуміють.</p></div><Link className="button button-light" href="/create">Створити сетап <span>↗</span></Link></section>
      </main>
    </>
  );
}
