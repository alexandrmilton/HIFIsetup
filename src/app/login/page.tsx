import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LoginForm } from "@/components/login-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getDictionary } from "@/lib/i18n/server";

export default async function LoginPage(props: PageProps<"/login">) {
  const [{ error, next }, t] = await Promise.all([props.searchParams, getDictionary()]);
  return (
    <>
      <SiteHeader />
      <main className="shell auth-wrap">
        <div className="auth-card">
          <p className="eyebrow">{t.auth.eyebrow}</p>
          <h1>{t.auth.title}</h1>
          <p>{t.auth.lede}</p>
          {typeof error === "string" && <p className="form-error">{error}</p>}
          <LoginForm isSupabaseReady={hasSupabaseEnv()} next={typeof next === "string" && next.startsWith("/") ? next : "/"} t={t} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
