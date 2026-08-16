import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OriginBadge } from "@/components/origin-badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignalChain } from "@/components/signal-chain";
import { ShareLink } from "@/components/share-link";
import { LikeButton } from "@/components/like-button";
import { getSetup } from "@/lib/setups";
import { getCurrentProfile, hasLikedSetup } from "@/lib/auth";

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
  const [setup, profile, liked] = await Promise.all([getSetup(slug), getCurrentProfile(), hasLikedSetup(slug)]);
  if (!setup) notFound();

  const room = setup.room;
  const roomFacts = [
    room.size && { label: "Розмір кімнати", value: room.size },
    room.hasAcousticTreatment !== null && { label: "Акустична обробка", value: room.hasAcousticTreatment ? "Так" : "Немає" },
    room.budgetRange && { label: "Бюджет", value: room.budgetRange },
  ].filter(Boolean) as { label: string; value: string }[];

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
              <div className="setup-actions">
                <LikeButton slug={setup.slug} initialCount={setup.likeCount} initiallyLiked={liked} isSignedIn={Boolean(profile)} />
                <ShareLink title={setup.title} />
              </div>
            </div>
          </div>

          {roomFacts.length > 0 && (
            <section className="room-facts">
              {roomFacts.map((fact) => <div className="room-fact" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </section>
          )}

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

          {(room.acousticNotes || room.listeningNotes) && (
            <section className="setup-notes">
              {room.acousticNotes && <div className="note-block"><p className="eyebrow">Про кімнату</p><p>{room.acousticNotes}</p></div>}
              {room.listeningNotes && <div className="note-block"><p className="eyebrow">Враження від звучання</p><p>{room.listeningNotes}</p></div>}
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
