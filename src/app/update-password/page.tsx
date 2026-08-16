import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getDictionary } from "@/lib/i18n/server";

export default async function UpdatePasswordPage() {
  const t = await getDictionary();
  return (
    <>
      <SiteHeader />
      <main className="shell auth-wrap">
        <div className="auth-card">
          <p className="eyebrow">{t.auth.eyebrow}</p>
          <h1>{t.auth.newPasswordTitle}</h1>
          <p>{t.auth.newPasswordLede}</p>
          <UpdatePasswordForm isSupabaseReady={hasSupabaseEnv()} t={t} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
