import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ProfileForm } from "@/components/profile-form";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { SignOutButton } from "@/components/sign-out-button";
import { MySetups } from "@/components/my-setups";
import { getCurrentProfile } from "@/lib/auth";
import { getSetupsByOwner } from "@/lib/setups";
import { avatarUrl, hasSupabaseEnv } from "@/lib/supabase/config";
import { getDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) redirect("/login");
  const [profile, t] = await Promise.all([getCurrentProfile(), getDictionary()]);
  if (!profile) redirect("/login?next=/profile");
  const setups = await getSetupsByOwner(profile.id);

  return (
    <>
      <SiteHeader />
      <main className="shell auth-wrap profile-wrap">
        <div className="auth-card">
          <p className="eyebrow">{t.profile.mySetupsEyebrow}</p>
          <h1>{setups.length > 0 ? `${setups.length}` : t.profile.empty}</h1>
          <p>{t.profile.lede}</p>
          <MySetups setups={setups} t={t} />
        </div>

        <div className="auth-card">
          <p className="eyebrow">{t.auth.eyebrow}</p>
          <h1>{profile.displayName || t.profile.settings}</h1>
          <p>{profile.email}</p>
          <ProfileForm profile={profile} avatarUrl={avatarUrl(profile.avatarPath)} t={t} />
        </div>

        <div className="auth-card">
          <p className="eyebrow">{t.profile.securityEyebrow}</p>
          <h1>{t.profile.changePassword}</h1>
          <UpdatePasswordForm isSupabaseReady={hasSupabaseEnv()} redirectTo={null} t={t} />
        </div>

        <SignOutButton label={t.profile.signOut} />
      </main>
      <SiteFooter />
    </>
  );
}
