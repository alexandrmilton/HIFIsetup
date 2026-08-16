import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { OriginBadge } from "@/components/origin-badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignalChain } from "@/components/signal-chain";
import { ShareLink } from "@/components/share-link";
import { LikeButton } from "@/components/like-button";
import { Comments } from "@/components/comments";
import { getSetup } from "@/lib/setups";
import { getCurrentProfile, hasLikedSetup } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/server";

export async function generateMetadata({ params }: PageProps<"/setups/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [setup, t] = await Promise.all([getSetup(slug), getDictionary()]);
  if (!setup) return { title: `${t.setup.notFound} — HiFiSetup` };
  return {
    title: `${setup.title} — HiFiSetup`,
    description: setup.description,
    openGraph: { title: setup.title, description: setup.description, images: setup.coverUrl ? [setup.coverUrl] : [] },
  };
}

export default async function SetupPage({ params }: PageProps<"/setups/[slug]">) {
  const { slug } = await params;
  const [setup, profile, liked, t] = await Promise.all([getSetup(slug), getCurrentProfile(), hasLikedSetup(slug), getDictionary()]);
  if (!setup) notFound();

  const isOwner = Boolean(profile && setup.ownerId === profile.id);
  const isStaff = Boolean(profile?.isAdmin || profile?.isModerator);
  // Unapproved setups stay visible to their owner and to staff only.
  if (setup.moderationStatus !== "approved" && !isOwner && !isStaff) notFound();

  const room = setup.room;
  const roomFacts = [
    room.size && { label: t.setup.roomSize, value: room.size },
    room.hasAcousticTreatment !== null && { label: t.setup.acoustics, value: room.hasAcousticTreatment ? t.setup.yes : t.setup.no },
    room.budgetRange && { label: t.setup.budget, value: room.budgetRange },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <SiteHeader />
      <main className="setup-page">
        <div className="shell">
          {setup.moderationStatus !== "approved" && (
            <div className={`status-banner status-banner-${setup.moderationStatus}`}>
              {setup.moderationStatus === "pending" ? t.setup.pendingBanner : t.setup.rejectedBanner}
            </div>
          )}

          <div className="setup-hero">
            {setup.coverUrl
              ? <img className="setup-hero-photo" src={setup.coverUrl} alt={setup.title} />
              : <div className="setup-hero-photo setup-hero-fallback" style={{ background: setup.palette.background }}><span>🎵</span></div>}
            <div className="setup-hero-copy">
              {!setup.isPublished && <span className="private-flag">{t.setup.privateFlag}</span>}
              <h1>{setup.title}</h1>
              <p className="byline">{setup.owner} · {setup.location} · {setup.components.length} {t.setup.components}</p>
              {setup.categories.length > 0 && <div className="setup-tags">{setup.categories.map((name) => <span className="setup-tag" key={name}>{name}</span>)}</div>}
              {setup.description && <p className="detail-description">{setup.description}</p>}
              <div className="setup-actions">
                <LikeButton slug={setup.slug} initialCount={setup.likeCount} initiallyLiked={liked} isSignedIn={Boolean(profile)} />
                <ShareLink title={setup.title} t={t} />
                {isOwner && <Link className="button button-outline button-small" href={`/setups/${setup.slug}/edit`}>{t.setup.edit}</Link>}
              </div>
            </div>
          </div>

          {roomFacts.length > 0 && (
            <section className="room-facts">
              {roomFacts.map((fact) => <div className="room-fact" key={fact.label}><small>{fact.label}</small><strong>{fact.value}</strong></div>)}
            </section>
          )}

          <SignalChain components={setup.components} t={t} />

          <section className="setup-components">
            <p className="eyebrow">{t.setup.allComponents}</p>
            <div className="component-grid">
              {setup.components.map((component) => (
                <div className="component-card" key={component.id}>
                  <span className="component-thumb" />
                  <div className="component-card-body">
                    <small>{component.category}</small>
                    <strong>{component.brand} {component.model}</strong>
                  </div>
                  <OriginBadge origin={component.origin} t={t} />
                </div>
              ))}
            </div>
          </section>

          {(room.acousticNotes || room.listeningNotes) && (
            <section className="setup-notes">
              {room.acousticNotes && <div className="note-block"><p className="eyebrow">{t.setup.aboutRoom}</p><p>{room.acousticNotes}</p></div>}
              {room.listeningNotes && <div className="note-block"><p className="eyebrow">{t.setup.listening}</p><p>{room.listeningNotes}</p></div>}
            </section>
          )}

          <Comments slug={setup.slug} initial={setup.comments} currentUserId={profile?.id ?? null} isAdmin={isStaff} t={t} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
