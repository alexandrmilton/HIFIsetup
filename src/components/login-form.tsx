"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Mode = "signin" | "signup";

export function LoginForm({ isSupabaseReady, next = "/", t }: { isSupabaseReady: boolean; next?: string; t: Dictionary }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSuccess = message === t.auth.checkMailConfirm || message === t.auth.checkMailReset;

  async function resetPassword() {
    if (!isSupabaseReady || !email) { setMessage(t.auth.enterEmail); return; }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/update-password` });
    setMessage(error ? error.message : t.auth.checkMailReset);
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
      else if (data.user && data.user.identities?.length === 0) setMessage(t.auth.exists);
      else setMessage(t.auth.checkMailConfirm);
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
        <button type="button" className={mode === "signin" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("signin"); setMessage(null); }}>{t.auth.signIn}</button>
        <button type="button" className={mode === "signup" ? "auth-tab active" : "auth-tab"} onClick={() => { setMode("signup"); setMessage(null); }}>{t.auth.signUp}</button>
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">{t.auth.email}</label>
          <input id="email" type="email" required autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!isSupabaseReady || loading} />
        </div>
        <div className="field">
          <label htmlFor="password">{t.auth.password}</label>
          <input id="password" type="password" required minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={t.auth.passwordHint} value={password} onChange={(event) => setPassword(event.target.value)} disabled={!isSupabaseReady || loading} />
        </div>
        {!isSupabaseReady && <p className="auth-note">{t.auth.envNote}</p>}
        {message && <p className={isSuccess ? "form-success" : "form-error"}>{message}</p>}
        <button className="button button-dark" type="submit" disabled={!isSupabaseReady || loading}>
          {loading ? t.auth.wait : mode === "signup" ? t.auth.submitSignUp : t.auth.submitSignIn} <span>→</span>
        </button>
        {mode === "signin" && <button type="button" className="text-link auth-forgot" onClick={resetPassword} disabled={!isSupabaseReady || loading}>{t.auth.forgot}</button>}
      </form>
    </>
  );
}
