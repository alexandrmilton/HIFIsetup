"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function UpdatePasswordForm({ isSupabaseReady, redirectTo = "/", t }: { isSupabaseReady: boolean; redirectTo?: string | null; t: Dictionary }) {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseReady) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setMessage(error.message);
    else if (redirectTo) window.location.href = redirectTo;
    else { setMessage(t.auth.passwordUpdated); setPassword(""); }
    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="password">{t.auth.newPassword}</label>
        <input id="password" type="password" required minLength={6} autoComplete="new-password" placeholder={t.auth.passwordHint} value={password} onChange={(event) => setPassword(event.target.value)} disabled={!isSupabaseReady || loading} />
      </div>
      {message && <p className={message === t.auth.passwordUpdated ? "form-success" : "form-error"}>{message}</p>}
      <button className="button button-dark" type="submit" disabled={!isSupabaseReady || loading}>
        {loading ? t.auth.wait : t.auth.savePassword} <span>→</span>
      </button>
    </form>
  );
}
