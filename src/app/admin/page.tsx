import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ModerationQueue } from "@/components/moderation-queue";
import { MemberRoles, type Member } from "@/components/member-roles";
import { UserComponents, type UserComponent } from "@/components/user-components";
import { getCurrentProfile } from "@/lib/auth";
import { getSetupsForModeration } from "@/lib/setups";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [profile, t, locale] = await Promise.all([getCurrentProfile(), getDictionary(), getLocale()]);
  // 404 rather than redirect: non-staff should not learn this page exists.
  if (!profile?.isAdmin && !profile?.isModerator) notFound();

  const setups = await getSetupsForModeration();
  const pending = setups.filter((setup) => setup.moderationStatus === "pending");
  const reviewed = setups.filter((setup) => setup.moderationStatus !== "pending");

  let members: Member[] = [];
  let userComponents: UserComponent[] = [];
  if (profile.isAdmin) {
    const supabase = await createClient();
    const [{ data: memberRows }, { data: componentRows }] = await Promise.all([
      supabase.rpc("list_members"),
      supabase.rpc("list_user_components"),
    ]);
    members = (memberRows as Member[] | null) ?? [];
    userComponents = (componentRows as UserComponent[] | null) ?? [];
  }

  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="page-head">
          <p className="eyebrow">{profile.isAdmin ? t.admin.eyebrowAdmin : t.admin.eyebrowMod}</p>
          <h1>{t.admin.title}</h1>
          <p>{t.admin.lede}{!profile.isAdmin && t.admin.ledeMod}</p>
        </div>

        <section className="admin-section">
          <h2>{t.admin.pending} ({pending.length})</h2>
          <ModerationQueue setups={pending} canDelete={profile.isAdmin} t={t} searchable />
        </section>

        <section className="admin-section">
          <h2>{t.admin.reviewed} ({reviewed.length})</h2>
          <ModerationQueue setups={reviewed} canDelete={profile.isAdmin} t={t} searchable />
        </section>

        {profile.isAdmin && (
          <>
            <section className="admin-section">
              <h2>{t.admin.userComponents} ({userComponents.length})</h2>
              <p className="admin-hint">{t.admin.userComponentsHint}</p>
              <UserComponents components={userComponents} t={t} locale={locale} />
            </section>

            <section className="admin-section">
              <h2>{t.admin.members} ({members.length})</h2>
              <p className="admin-hint">{t.admin.membersHint}</p>
              <MemberRoles members={members} t={t} />
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
