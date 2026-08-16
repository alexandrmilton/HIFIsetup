"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { OriginBadge } from "@/components/origin-badge";
import { ComponentPicker } from "@/components/component-picker";
import type { AudioComponent, Category, Setup } from "@/lib/types";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";

type Step = 1 | 2 | 3;
type DraftSetup = { title: string; location: string; description: string; isPublished: boolean; categoryIds: string[]; roomSize: string; hasAcousticTreatment: boolean | null; acousticNotes: string; listeningNotes: string; budgetRange: string };

// Keep covers small enough to stay within the free storage tier while still
// looking sharp on a retina card. The bucket enforces the same ceiling.
const MAX_COVER_MB = 4;
const MAX_COVER_BYTES = MAX_COVER_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const BUDGETS = ["до $500", "$500 – $1 500", "$1 500 – $5 000", "$5 000 – $15 000", "понад $15 000"];

export function SetupWizard({ categories, isSupabaseReady, ownerId, existing, t }: { categories: Category[]; isSupabaseReady: boolean; ownerId: string | null; existing?: Setup; t: Dictionary }) {
  const isEdit = Boolean(existing);
  const [step, setStep] = useState<Step>(1);
  const [setup, setSetup] = useState<DraftSetup>({
    title: existing?.title ?? "",
    location: existing && existing.location !== "Україна" ? existing.location : "",
    description: existing?.description ?? "",
    isPublished: existing?.isPublished ?? true,
    categoryIds: existing?.categoryIds ?? [],
    roomSize: existing?.room.size ?? "",
    hasAcousticTreatment: existing?.room.hasAcousticTreatment ?? null,
    acousticNotes: existing?.room.acousticNotes ?? "",
    listeningNotes: existing?.room.listeningNotes ?? "",
    budgetRange: existing?.room.budgetRange ?? "",
  });
  const [coverPath, setCoverPath] = useState<string | null>(existing?.coverPath ?? null);
  const [coverPreview, setCoverPreview] = useState<string | null>(existing?.coverUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selected, setSelected] = useState<AudioComponent[]>(existing?.components ?? []);
  const [showPicker, setShowPicker] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function uploadCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !isSupabaseReady || !ownerId) return;
    if (!ALLOWED_TYPES.includes(file.type)) { setMessage({ type: "error", text: t.wizard.errFileType }); return; }
    if (file.size > MAX_COVER_BYTES) { setMessage({ type: "error", text: format(t.wizard.errFileSize, { mb: (file.size / 1024 / 1024).toFixed(1), max: MAX_COVER_MB }) }); return; }

    setUploadingCover(true);
    setMessage(null);
    const supabase = createClient();
    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `covers/${ownerId}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from("setup-images").upload(path, file, { upsert: true, contentType: file.type });
    setUploadingCover(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    setCoverPath(path);
    setCoverPreview(URL.createObjectURL(file));
  }

  function toggleCategory(id: string) { setSetup((current) => ({ ...current, categoryIds: current.categoryIds.includes(id) ? current.categoryIds.filter((value) => value !== id) : [...current.categoryIds, id] })); }
  function moveComponent(index: number, direction: -1 | 1) { setSelected((items) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  function removeComponent(id: string) { setSelected((items) => items.filter((item) => item.id !== id)); }

  function goToComponents() { if (!setup.title.trim()) { setMessage({ type: "error", text: t.wizard.errNoTitle }); return; } setMessage(null); setStep(2); }
  function goToPublish() { if (selected.length === 0) { setMessage({ type: "error", text: t.wizard.errNoComponents }); return; } setMessage(null); setStep(3); }

  async function saveSetup() {
    if (!isSupabaseReady) { setMessage({ type: "error", text: t.auth.envNote }); return; }
    setSaving(true);
    setMessage(null);
    const response = await fetch(isEdit ? `/api/setups/${existing!.slug}` : "/api/setups", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...setup, coverPath, components: selected }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) { setMessage({ type: "error", text: payload.error ?? "Error" }); return; }
    setSavedSlug(payload.slug);
    setMessage({ type: "success", text: isEdit ? t.wizard.savedEdit : t.wizard.moderationTitle });
  }

  return (
    <div className="builder-shell">
      <div className="builder-card">
        <div className="wizard-steps">
          <span className={step === 1 ? "wizard-step active" : "wizard-step done"}><b>1</b><em>{t.wizard.step1}</em></span>
          <span className="wizard-step-line" />
          <span className={step === 2 ? "wizard-step active" : step > 2 ? "wizard-step done" : "wizard-step"}><b>2</b><em>{t.wizard.step2}</em></span>
          <span className="wizard-step-line" />
          <span className={step === 3 ? "wizard-step active" : "wizard-step"}><b>3</b><em>{t.wizard.step3}</em></span>
        </div>

        {step === 1 && (
          <section className="form-section">
            <h2>{t.wizard.aboutSetup}</h2>
            <button type="button" className="cover-dropzone" onClick={() => coverInput.current?.click()} disabled={!isSupabaseReady}>
              {coverPreview ? <img src={coverPreview} alt="" /> : <><span className="cover-dropzone-icon">📷</span><span>{t.wizard.dropzone}</span><small>{t.wizard.dropzoneHint}</small></>}
              {uploadingCover && <small>{t.profile.uploading}</small>}
            </button>
            <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadCover} />
            <div className="field"><label htmlFor="setup-title">{t.wizard.title}</label><input id="setup-title" required placeholder={t.wizard.titlePlaceholder} value={setup.title} onChange={(event) => setSetup({ ...setup, title: event.target.value })} /></div>
            <div className="field"><label htmlFor="setup-description">{t.wizard.description}</label><textarea id="setup-description" placeholder={t.wizard.descriptionPlaceholder} value={setup.description} onChange={(event) => setSetup({ ...setup, description: event.target.value })} /></div>
            <div className="two-fields">
              <div className="field"><label htmlFor="setup-location">{t.wizard.city}</label><input id="setup-location" placeholder={t.wizard.cityPlaceholder} value={setup.location} onChange={(event) => setSetup({ ...setup, location: event.target.value })} /></div>
              <div className="field"><label htmlFor="setup-visibility">{t.wizard.visibility}</label><select id="setup-visibility" value={setup.isPublished ? "public" : "private"} onChange={(event) => setSetup({ ...setup, isPublished: event.target.value === "public" })}><option value="public">{t.wizard.visibilityPublic}</option><option value="private">{t.wizard.visibilityPrivate}</option></select></div>
            </div>
            <div className="field"><label>{t.wizard.category}</label><div className="type-options">{categories.map((category) => <button key={category.id} type="button" className={`type-option ${setup.categoryIds.includes(category.id) ? "active" : ""}`} onClick={() => toggleCategory(category.id)}>{category.name}</button>)}</div></div>
            {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
            <button className="button button-dark" type="button" onClick={goToComponents}>{t.wizard.next1} <span>→</span></button>
          </section>
        )}

        {step === 2 && (
          <section className="form-section">
            <h2>{t.wizard.componentsStep}</h2>
            {!showPicker && <button className="button button-outline button-small" type="button" onClick={() => setShowPicker(true)}>{t.wizard.addComponent}</button>}
            {showPicker && <ComponentPicker onAdd={(component) => setSelected((items) => [...items, component])} onClose={() => setShowPicker(false)} t={t} />}
            {selected.length > 0 && (
              <div className="draft-components">
                <p className="eyebrow" style={{ marginTop: 18 }}>{t.wizard.chainHint}</p>
                {selected.map((item, index) => (
                  <div className="draft-component chain-editable" key={item.id}>
                    <span className="component-thumb" />
                    <div><b>{item.brand} {item.model}</b><small>{item.category}</small></div>
                    <OriginBadge origin={item.origin} t={t} />
                    <div className="chain-move">
                      <button type="button" className="chain-move-btn" aria-label={t.wizard.up} onClick={() => moveComponent(index, -1)} disabled={index === 0}>↑</button>
                      <button type="button" className="chain-move-btn" aria-label={t.wizard.down} onClick={() => moveComponent(index, 1)} disabled={index === selected.length - 1}>↓</button>
                    </div>
                    <button className="remove" type="button" aria-label={`${t.wizard.remove} ${item.model}`} onClick={() => removeComponent(item.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
            {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
            <div className="wizard-nav"><button className="button button-outline button-small" type="button" onClick={() => setStep(1)}>{t.wizard.back}</button><button className="button button-dark" type="button" onClick={goToPublish}>{t.wizard.next2} <span>→</span></button></div>
          </section>
        )}

        {step === 3 && (
          <section className="form-section">
            <h2>{t.wizard.publishStep}</h2>
            {savedSlug ? (
              <div className="publish-done">
                <div className="moderation-notice">
                  <span className="moderation-notice-icon" aria-hidden="true">🕓</span>
                  <div>
                    <strong>{t.wizard.moderationTitle}</strong>
                    <p>{t.wizard.moderationText}</p>
                  </div>
                </div>
                <div className="publish-share">
                  <p className="eyebrow">{t.wizard.linkLabel}</p>
                  <code className="publish-url">{typeof window !== "undefined" ? `${window.location.origin}/setups/${savedSlug}` : `/setups/${savedSlug}`}</code>
                </div>
                <div className="wizard-nav">
                  <a className="button button-dark" href={`/setups/${savedSlug}`}>{t.wizard.view} <span>→</span></a>
                  <a className="button button-outline button-small" href="/profile">{t.wizard.mySetups}</a>
                </div>
              </div>
            ) : (
              <>
                <p className="publish-lede">{t.wizard.publishLede}</p>

                <div className="two-fields">
                  <div className="field"><label htmlFor="room-size">{t.wizard.roomSize}</label><input id="room-size" placeholder={t.wizard.roomSizePlaceholder} value={setup.roomSize} onChange={(event) => setSetup({ ...setup, roomSize: event.target.value })} /></div>
                  <div className="field"><label htmlFor="budget-range">{t.wizard.budget}</label>
                    <select id="budget-range" value={setup.budgetRange} onChange={(event) => setSetup({ ...setup, budgetRange: event.target.value })}>
                      <option value="">{t.wizard.budgetNone}</option>
                      {BUDGETS.map((budget) => <option key={budget}>{budget}</option>)}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>{t.wizard.acoustics}</label>
                  <div className="type-options">
                    <button type="button" className={`type-option ${setup.hasAcousticTreatment === true ? "active" : ""}`} onClick={() => setSetup({ ...setup, hasAcousticTreatment: true })}>{t.wizard.acousticsYes}</button>
                    <button type="button" className={`type-option ${setup.hasAcousticTreatment === false ? "active" : ""}`} onClick={() => setSetup({ ...setup, hasAcousticTreatment: false })}>{t.wizard.acousticsNo}</button>
                    <button type="button" className={`type-option ${setup.hasAcousticTreatment === null ? "active" : ""}`} onClick={() => setSetup({ ...setup, hasAcousticTreatment: null })}>{t.wizard.acousticsSkip}</button>
                  </div>
                </div>

                {setup.hasAcousticTreatment === true && (
                  <div className="field"><label htmlFor="acoustic-notes">{t.wizard.acousticNotes}</label><textarea id="acoustic-notes" placeholder={t.wizard.acousticNotesPlaceholder} value={setup.acousticNotes} onChange={(event) => setSetup({ ...setup, acousticNotes: event.target.value })} /></div>
                )}

                <div className="field"><label htmlFor="listening-notes">{t.wizard.listeningNotes}</label><textarea id="listening-notes" placeholder={t.wizard.listeningNotesPlaceholder} value={setup.listeningNotes} onChange={(event) => setSetup({ ...setup, listeningNotes: event.target.value })} /></div>

                <div className="publish-summary">
                  <p className="eyebrow">{t.wizard.summary}</p>
                  <div className="summary-row"><span>{t.wizard.summaryTitle}</span><strong>{setup.title || "—"}</strong></div>
                  <div className="summary-row"><span>{t.wizard.summaryComponents}</span><strong>{selected.length}</strong></div>
                  <div className="summary-row"><span>{t.wizard.summaryCategories}</span><strong>{setup.categoryIds.length || "—"}</strong></div>
                  <div className="summary-row"><span>{t.wizard.summaryCover}</span><strong>{coverPath ? t.wizard.summaryCoverYes : t.wizard.summaryCoverNo}</strong></div>
                  <div className="summary-row"><span>{t.wizard.summaryVisibility}</span><strong>{setup.isPublished ? t.profile.public : t.profile.private}</strong></div>
                </div>

                {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
                <div className="wizard-nav"><button className="button button-outline button-small" type="button" onClick={() => setStep(2)}>{t.wizard.back}</button><button className="button button-dark" type="button" onClick={saveSetup} disabled={saving}>{saving ? t.wizard.saving : isEdit ? t.wizard.submitEdit : t.wizard.submit} <span>→</span></button></div>
              </>
            )}
          </section>
        )}
      </div>

      <aside className="preview-card">
        <h3>{t.wizard.preview}</h3>
        {coverPreview ? <div className="preview-art preview-art-photo" style={{ backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }} /> : <div className="preview-art" />}
        <h2>{setup.title || t.wizard.previewTitle}</h2>
        <p className="byline">{setup.location || t.wizard.previewCity} · {setup.isPublished ? t.wizard.previewPublic : t.wizard.previewPrivate}</p>
        {setup.categoryIds.length > 0 && <div className="setup-tags">{categories.filter((category) => setup.categoryIds.includes(category.id)).map((category) => <span className="setup-tag" key={category.id}>{category.name}</span>)}</div>}
        <div className="preview-stat"><span>{t.wizard.statComponents}</span><span>{selected.length}</span></div>
        <div className="preview-stat"><span>{t.wizard.statSpecial}</span><span>{selected.filter((item) => item.origin !== "standard").length}</span></div>
      </aside>
    </div>
  );
}
