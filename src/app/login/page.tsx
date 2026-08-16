import { SiteHeader } from "@/components/site-header";
import { LoginForm } from "@/components/login-form";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default function LoginPage() { return <><SiteHeader /><main className="shell auth-wrap"><div className="auth-card"><p className="eyebrow">Ваш профіль</p><h1>Увійти без пароля.</h1><p>Надішлемо вам безпечне посилання — так простіше повертатися до власних сетапів.</p><LoginForm isSupabaseReady={hasSupabaseEnv()} /></div></main></>; }
