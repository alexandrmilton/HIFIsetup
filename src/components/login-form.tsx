"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ isSupabaseReady }: { isSupabaseReady: boolean }) {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (!isSupabaseReady) return; setLoading(true); setMessage(null); const supabase = createClient(); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } }); setMessage(error ? error.message : "Перевірте пошту — посилання для входу вже там."); setLoading(false); }
  return <form onSubmit={submit}><div className="field"><label htmlFor="email">Email</label><input id="email" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!isSupabaseReady || loading} /></div>{!isSupabaseReady && <p className="auth-note">Спершу додайте ключі Supabase у <code>.env.local</code>. Шаблон лежить у <code>.env.example</code>.</p>}{message && <p className={message.startsWith("Перевірте") ? "form-success" : "form-error"}>{message}</p>}<button className="button button-dark" type="submit" disabled={!isSupabaseReady || loading}>{loading ? "Надсилаємо…" : "Надіслати посилання"} <span>→</span></button></form>;
}
