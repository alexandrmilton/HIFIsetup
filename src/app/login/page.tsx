import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "@/components/login-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function LoginPage(props: PageProps<"/login">) {
  const { error, next } = await props.searchParams;
  return (
    <>
      <SiteHeader />
      <main className="shell auth-wrap">
        <div className="auth-card">
          <p className="eyebrow">Ваш профіль</p>
          <h1>Ваш звук чекає.</h1>
          <p>Увійдіть або зареєструйтеся, щоб зберігати й ділитися власними сетапами.</p>
          {typeof error === "string" && <p className="form-error">{error}</p>}
          <LoginForm isSupabaseReady={hasSupabaseEnv()} next={typeof next === "string" && next.startsWith("/") ? next : "/"} />
        </div>
      </main>
    </>
  );
}
