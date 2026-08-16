"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CurrentProfile } from "@/lib/auth";

export function ProfileForm({ profile, avatarUrl }: { profile: CurrentProfile; avatarUrl: string | null }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    setMessage(null);
    const supabase = createClient();
    const path = `avatars/${profile.id}-${Date.now()}.${file.name.split(".").pop() ?? "jpg"}`;
    const { error: uploadError } = await supabase.storage.from("setup-images").upload(path, file, { upsert: true });
    if (uploadError) { setMessage({ type: "error", text: uploadError.message }); setUploading(false); return; }
    const { error: updateError } = await supabase.from("profiles").upsert({ id: profile.id, avatar_path: path });
    setUploading(false);
    if (updateError) { setMessage({ type: "error", text: updateError.message }); return; }
    setPreview(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/setup-images/${path}`);
    setMessage({ type: "success", text: "Аватар оновлено." });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({ id: profile.id, display_name: displayName.trim() || null, username: username.trim() || null, bio: bio.trim() || null });
    setSaving(false);
    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Профіль збережено." });
  }

  return (
    <>
      <div className="profile-avatar-row">
        <button type="button" className="profile-avatar-preview" onClick={() => fileInput.current?.click()} aria-label="Змінити аватар">
          {preview ? <img src={preview} alt="" /> : <span>{(displayName || profile.email || "?").charAt(0).toUpperCase()}</span>}
        </button>
        <div>
          <button type="button" className="button button-outline button-small" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? "Завантажуємо…" : "Змінити фото"}</button>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); }} />
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="display-name">Ім’я</label><input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Як до вас звертатися" /></div>
        <div className="field"><label htmlFor="username">Нікнейм</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="unique_username" /></div>
        <div className="field"><label htmlFor="bio">Про себе</label><textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Кілька слів про вас і ваш підхід до звуку" /></div>
        {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
        <button className="button button-dark" type="submit" disabled={saving}>{saving ? "Зберігаємо…" : "Зберегти профіль"} <span>→</span></button>
      </form>
    </>
  );
}
