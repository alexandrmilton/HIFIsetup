"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CurrentProfile } from "@/lib/auth";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const MAX_MB = 4;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfileForm({ profile, avatarUrl, t }: { profile: CurrentProfile; avatarUrl: string | null; t: Dictionary }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) { setMessage({ type: "error", text: t.wizard.errFileType }); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setMessage({ type: "error", text: t.wizard.errFileSize((file.size / 1024 / 1024).toFixed(1), MAX_MB) }); return; }

    setUploading(true);
    setMessage(null);
    const supabase = createClient();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `avatars/${profile.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("setup-images").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setMessage({ type: "error", text: uploadError.message }); setUploading(false); return; }
    const { error: updateError } = await supabase.from("profiles").upsert({ id: profile.id, avatar_path: path });
    setUploading(false);
    if (updateError) { setMessage({ type: "error", text: updateError.message }); return; }
    setPreview(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/setup-images/${path}`);
    setMessage({ type: "success", text: t.profile.avatarUpdated });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({ id: profile.id, display_name: displayName.trim() || null, username: username.trim() || null, bio: bio.trim() || null });
    setSaving(false);
    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: t.profile.saved });
  }

  return (
    <>
      <div className="profile-avatar-row">
        <button type="button" className="profile-avatar-preview" onClick={() => fileInput.current?.click()} aria-label={t.profile.changePhoto}>
          {preview ? <img src={preview} alt="" /> : <span>{(displayName || profile.email || "?").charAt(0).toUpperCase()}</span>}
        </button>
        <div>
          <button type="button" className="button button-outline button-small" onClick={() => fileInput.current?.click()} disabled={uploading}>{uploading ? t.profile.uploading : t.profile.changePhoto}</button>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAvatar(file); }} />
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="field"><label htmlFor="display-name">{t.profile.name}</label><input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t.profile.namePlaceholder} /></div>
        <div className="field"><label htmlFor="username">{t.profile.username}</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="unique_username" /></div>
        <div className="field"><label htmlFor="bio">{t.profile.bio}</label><textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder={t.profile.bioPlaceholder} /></div>
        {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
        <button className="button button-dark" type="submit" disabled={saving}>{saving ? t.profile.saving : t.profile.save} <span>→</span></button>
      </form>
    </>
  );
}
