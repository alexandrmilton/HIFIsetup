"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm({ isSupabaseReady }: { isSupabaseReady: boolean }) {
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
    else window.location.href = "/";
    setLoading(false);
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="password">Новий пароль</label>
        <input id="password" type="password" required minLength={6} autoComplete="new-password" placeholder="Мінімум 6 символів" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!isSupabaseReady || loading} />
      </div>
      {message && <p className="form-error">{message}</p>}
      <button className="button button-dark" type="submit" disabled={!isSupabaseReady || loading}>
        {loading ? "Зачекайте…" : "Зберегти пароль"} <span>→</span>
      </button>
    </form>
  );
}
