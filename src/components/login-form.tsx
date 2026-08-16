"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm({ isSupabaseReady, next = "/" }: { isSupabaseReady: boolean; next?: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resetPassword() {
    if (!isSupabaseReady || !email) { setMessage("Спершу введіть email вище."); return; }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/update-password` });
    setMessage(error ? error.message : "Перевірте пошту — лист для відновлення пароля вже там.");
    setLoading(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseReady) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
      if (error) setMessage(error.message);
      else if (data.user && data.user.identities?.length === 0) setMessage("Акаунт із цим email вже існує. Увійдіть або натисніть «Забули пароль?».");
      else setMessage("Перевірте пошту — лист із підтвердженням вже там.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else window.location.href = next;
    }
    setLoading(false);
  }

  return (
    <>
      <div className="auth-tabs">
        <button type="button" className={mode === "signin" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("signin"); setMessage(null); }}>Увійти</button>
        <button type="button" className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("signup"); setMessage(null); }}>Реєстрація</button>
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!isSupabaseReady || loading} />
        </div>
        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input id="password" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder="Мінімум 6 символів" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!isSupabaseReady || loading} />
        </div>
        {!isSupabaseReady && <p className="auth-note">Спершу додайте ключі Supabase у <code>.env.local</code>. Шаблон лежить у <code>.env.example</code>.</p>}
        {message && <p className={message.startsWith("Перевірте") ? "form-success" : "form-error"}>{message}</p>}
        <button className="button button-dark" type="submit" disabled={!isSupabaseReady || loading}>
          {loading ? "Зачекайте…" : mode === "signup" ? "Зареєструватися" : "Увійти"} <span>→</span>
        </button>
        {mode === "signin" && <button type="button" className="text-link auth-forgot" onClick={resetPassword} disabled={!isSupabaseReady || loading}>Забули пароль?</button>}
      </form>
    </>
  );
}
