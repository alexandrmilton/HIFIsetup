import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { ProfileForm } from "@/components/profile-form";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentProfile } from "@/lib/auth";
import { avatarUrl, hasSupabaseEnv } from "@/lib/supabase/config";

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) redirect("/login");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/profile");
  return (
    <>
      <SiteHeader />
      <main className="shell auth-wrap profile-wrap">
        <div className="auth-card">
          <p className="eyebrow">Ваш профіль</p>
          <h1>{profile.displayName || "Налаштування"}</h1>
          <p>{profile.email}</p>
          <ProfileForm profile={profile} avatarUrl={avatarUrl(profile.avatarPath)} />
        </div>
        <div className="auth-card">
          <p className="eyebrow">Безпека</p>
          <h1>Змінити пароль.</h1>
          <UpdatePasswordForm isSupabaseReady={hasSupabaseEnv()} redirectTo={null} />
        </div>
        <SignOutButton />
      </main>
    </>
  );
}
