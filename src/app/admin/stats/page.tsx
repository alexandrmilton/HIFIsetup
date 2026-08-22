import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { StoragePurge } from "@/components/storage-purge";
import { ThumbnailBackfill } from "@/components/thumbnail-backfill";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { formatBytes, percentOf } from "@/lib/format";
import { format } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

/** Supabase free-tier allowances, shown so the numbers have a scale. */
const STORAGE_LIMIT = 1024 * 1024 * 1024;
const DATABASE_LIMIT = 500 * 1024 * 1024;

type Stats = {
  storage: { files: number; bytes: number; covers: number; gallery: number; avatars: number;
             orphanFiles: number; orphanBytes: number; purgeableFiles: number; purgeableBytes: number;
             legacyFiles?: number; legacyBytes?: number; largestBytes: number };
  database: { bytes: number; appBytes: number; setups: number; components: number; members: number; comments: number; likes: number };
  content: { pending: number; approved: number; rejected: number; private: number; admins: number; moderators: number;
             memberAdded: number; seeded: number; unusedComponents: number;
             setupsThisWeek: number; membersThisWeek: number; withoutCover: number };
};

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = percentOf(used, limit);
  return (
    <div className="stat-meter">
      <div className="stat-meter-head"><span>{label}</span><strong>{percent}%</strong></div>
      <div className="stat-meter-track"><div className="stat-meter-fill" style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

const Row = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="stat-row">
    <span>{label}{hint && <small className="stat-hint">{hint}</small>}</span>
    <strong>{value}</strong>
  </div>
);

export default async function AdminStatsPage() {
  const [profile, t] = await Promise.all([getCurrentProfile(), getDictionary()]);
  // 404 rather than redirect: non-admins should not learn this page exists.
  if (!profile?.isAdmin) notFound();

  const supabase = await createClient();
  // The same scan the purge button acts on, so the list and the count can never
  // disagree — "5 purgeable" with nothing named was the whole complaint.
  const [{ data, error }, { data: orphanList }] = await Promise.all([
    supabase.rpc("get_admin_stats"),
    supabase.rpc("list_orphan_images", { p_min_age_hours: 24 }),
  ]);
  if (error || !data) notFound();
  const stats = data as Stats;
  const orphans = (orphanList as { path: string; bytes: number; created_at: string }[] | null) ?? [];
  const { storage, database, content } = stats;
  // Absent until the backfill migration lands, so the card degrades to zero
  // rather than rendering "undefined · NaN" on a deploy that arrives first.
  const legacyFiles = storage.legacyFiles ?? 0;

  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">{t.adminStats.eyebrow}</p>
          <h1>{t.adminStats.title}</h1>
          <p>{t.adminStats.lede}</p>
        </div>

        <section className="admin-section">
          <h2>{t.adminStats.storage}</h2>
          <p className="admin-hint">{t.adminStats.lag}</p>
          <div className="stat-cards">
            <div className="stat-card">
              <Meter label={format(t.adminStats.ofLimit, { limit: formatBytes(STORAGE_LIMIT) })} used={storage.bytes} limit={STORAGE_LIMIT} />
              <Row label={t.adminStats.totalSize} value={formatBytes(storage.bytes)} />
              <Row label={t.adminStats.files} value={storage.files} />
              <Row label={t.adminStats.largest} value={formatBytes(storage.largestBytes)} />
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.covers} value={storage.covers} />
              <Row label={t.adminStats.galleryPhotos} value={storage.gallery} />
              <Row label={t.adminStats.avatars} value={storage.avatars} />
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.orphans} value={`${storage.orphanFiles} · ${formatBytes(storage.orphanBytes)}`} hint={t.adminStats.orphansHint} />
              <Row label={t.adminStats.purgeable} value={`${storage.purgeableFiles} · ${formatBytes(storage.purgeableBytes)}`} hint={t.adminStats.purgeableHint} />
              <StoragePurge purgeableFiles={storage.purgeableFiles} t={t} />
              {orphans.length > 0 && (
                <ul className="orphan-list">
                  {orphans.map((file) => (
                    <li key={file.path}>
                      <code>{file.path}</code>
                      <span>{formatBytes(Number(file.bytes ?? 0))} · {new Date(file.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.legacy} value={`${legacyFiles} · ${formatBytes(storage.legacyBytes ?? 0)}`} hint={t.adminStats.legacyHint} />
              <ThumbnailBackfill legacyFiles={legacyFiles} t={t} />
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>{t.adminStats.database}</h2>
          <div className="stat-cards">
            <div className="stat-card">
              <Meter label={format(t.adminStats.ofLimit, { limit: formatBytes(DATABASE_LIMIT) })} used={database.bytes} limit={DATABASE_LIMIT} />
              <Row label={t.adminStats.dbSize} value={formatBytes(database.bytes)} hint={t.adminStats.dbHint} />
              <Row label={t.adminStats.dbApp} value={formatBytes(database.appBytes)} />
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.setups} value={database.setups} />
              <Row label={t.adminStats.components} value={database.components} />
              <Row label={t.adminStats.members} value={database.members} />
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.comments} value={database.comments} />
              <Row label={t.adminStats.likes} value={database.likes} />
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>{t.adminStats.content}</h2>
          <div className="stat-cards">
            <div className="stat-card">
              <Row label={t.adminStats.pending} value={content.pending} />
              <Row label={t.adminStats.approved} value={content.approved} />
              <Row label={t.adminStats.rejected} value={content.rejected} />
              <Row label={t.adminStats.privateSetups} value={content.private} />
              <Row label={t.adminStats.withoutCover} value={content.withoutCover} />
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.memberAdded} value={content.memberAdded} />
              <Row label={t.adminStats.seeded} value={content.seeded} />
              <Row label={t.adminStats.unusedComponents} value={content.unusedComponents} hint={t.adminStats.unusedHint} />
            </div>
            <div className="stat-card">
              <Row label={t.adminStats.setupsThisWeek} value={content.setupsThisWeek} />
              <Row label={t.adminStats.membersThisWeek} value={content.membersThisWeek} />
              <Row label={t.adminStats.admins} value={content.admins} />
              <Row label={t.adminStats.moderators} value={content.moderators} />
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>{t.adminStats.external}</h2>
          <p className="admin-hint">{t.adminStats.externalHint}</p>
          <div className="external-links">
            <a className="button button-outline button-small" href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">{t.adminStats.openVercel} <span>↗</span></a>
            <a className="button button-outline button-small" href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">{t.adminStats.openSupabase} <span>↗</span></a>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
