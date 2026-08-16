import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModerationQueue } from "@/components/moderation-queue";
import { getCurrentProfile } from "@/lib/auth";
import { getSetupsForModeration } from "@/lib/setups";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const profile = await getCurrentProfile();
  // 404 rather than redirect: non-admins should not learn this page exists.
  if (!profile?.isAdmin) notFound();

  const setups = await getSetupsForModeration();
  const pending = setups.filter((setup) => setup.moderationStatus === "pending");
  const reviewed = setups.filter((setup) => setup.moderationStatus !== "pending");

  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">Модерація</p>
          <h1>Черга на публікацію.</h1>
          <p>Сетапи стають видимими на головній лише після схвалення.</p>
        </div>

        <section className="admin-section">
          <h2>Очікують ({pending.length})</h2>
          <ModerationQueue setups={pending} />
        </section>

        <section className="admin-section">
          <h2>Опрацьовані ({reviewed.length})</h2>
          <ModerationQueue setups={reviewed} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
