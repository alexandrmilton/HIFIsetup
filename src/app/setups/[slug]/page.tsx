import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OriginBadge } from "@/components/origin-badge";
import { SiteHeader } from "@/components/site-header";
import { SignalChain } from "@/components/signal-chain";
import { ShareLink } from "@/components/share-link";
import { getSetup } from "@/lib/setups";

export async function generateMetadata({ params }: PageProps<"/setups/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const setup = await getSetup(slug);
  if (!setup) return { title: "Сетап не знайдено — HiFiSetup" };
  return {
    title: `${setup.title} — HiFiSetup`,
    description: setup.description,
    openGraph: { title: setup.title, description: setup.description, images: setup.coverUrl ? [setup.coverUrl] : [] },
  };
}

export default async function SetupPage({ params }: PageProps<"/setups/[slug]">) {
  const { slug } = await params;
  const setup = await getSetup(slug);
  if (!setup) notFound();

  return (
    <>
      <SiteHeader />
      <main className="setup-page">
        <div className="shell">
          <div className="setup-hero">
            {setup.coverUrl
              ? <img className="setup-hero-photo" src={setup.coverUrl} alt={setup.title} />
              : <div className="setup-hero-photo setup-hero-fallback" style={{ background: setup.palette.background }}><span>🎵</span></div>}
            <div className="setup-hero-copy">
              {!setup.isPublished && <span className="private-flag">Приватний · видно лише за посиланням</span>}
              <h1>{setup.title}</h1>
              <p className="byline">{setup.owner} · {setup.location} · {setup.components.length} компоненти</p>
              {setup.categories.length > 0 && <div className="setup-tags">{setup.categories.map((name) => <span className="setup-tag" key={name}>{name}</span>)}</div>}
              {setup.description && <p className="detail-description">{setup.description}</p>}
              <ShareLink />
            </div>
          </div>

          <SignalChain components={setup.components} />

          <section className="setup-components">
            <p className="eyebrow">Усі компоненти</p>
            <div className="component-grid">
              {setup.components.map((component) => (
                <div className="component-card" key={component.id}>
                  <span className="component-thumb" />
                  <div className="component-card-body">
                    <small>{component.category}</small>
                    <strong>{component.brand} {component.model}</strong>
                  </div>
                  <OriginBadge origin={component.origin} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
