import { SiteHeader } from "@/components/site-header";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default function UpdatePasswordPage() {
  return (
    <>
      <SiteHeader />
      <main className="shell auth-wrap">
        <div className="auth-card">
          <p className="eyebrow">Ваш профіль</p>
          <h1>Новий пароль.</h1>
          <p>Встановіть новий пароль для входу.</p>
          <UpdatePasswordForm isSupabaseReady={hasSupabaseEnv()} />
        </div>
      </main>
    </>
  );
}
