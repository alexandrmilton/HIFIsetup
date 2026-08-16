"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function LoginForm({ isSupabaseReady }: { isSupabaseReady: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseReady) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback`;
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } });
      setMessage(error ? error.message : "Перевірте пошту — лист із підтвердженням вже там.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
      else window.location.href = "/";
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
      </form>
    </>
  );
}
