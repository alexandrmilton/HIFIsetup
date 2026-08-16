"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CurrentProfile } from "@/lib/auth";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

const MAX_AVATAR_KB = 512;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfileForm({ profile, avatarUrl, t }: { profile: CurrentProfile; avatarUrl: string | null; t: Dictionary }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function uploadAvatar(file: File) {
    if (!ALLOWED_TYPES.includes(file.type)) { setMessage({ type: "error", text: t.wizard.errFileType }); return; }
    if (file.size > MAX_AVATAR_KB * 1024) { setMessage({ type: "error", text: format(t.profile.avatarTooLarge, { kb: Math.round(file.size / 1024), max: MAX_AVATAR_KB }) }); return; }

    setUploading(true);
    setMessage(null);
    const supabase = createClient();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `avatars/${profile.id}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("setup-images").upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) { setMessage({ type: "error", text: uploadError.message }); setUploading(false); return; }
    // A plain UPDATE, not an upsert: the profile row already exists (created by
    // a trigger at signup) and members hold UPDATE on these columns only.
    const { error: updateError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", profile.id);
    setUploading(false);
    if (updateError) { setMessage({ type: "error", text: updateError.message }); return; }
    setPreview(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/setup-images/${path}`);
    setMessage({ type: "success", text: t.profile.avatarUpdated });
    router.refresh();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) { setMessage({ type: "error", text: t.profile.nameRequired }); return; }

    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ display_name: name, bio: bio.trim() || null }).eq("id", profile.id);
    setSaving(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setMessage({ type: "success", text: t.profile.saved });
    router.refresh();
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
          <small className="field-hint avatar-hint">{t.profile.avatarHint}</small>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="display-name">{t.profile.name}</label>
          <input id="display-name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={t.profile.namePlaceholder} />
          <small className="field-hint">{t.profile.nameHint}</small>
        </div>
        <div className="field"><label htmlFor="bio">{t.profile.bio}</label><textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder={t.profile.bioPlaceholder} /></div>
        {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
        <button className="button button-dark" type="submit" disabled={saving}>{saving ? t.profile.saving : t.profile.save} <span>→</span></button>
      </form>
    </>
  );
}
