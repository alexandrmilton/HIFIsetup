"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { OriginBadge } from "@/components/origin-badge";
import { ComponentPicker } from "@/components/component-picker";
import type { AudioComponent, Category, Setup } from "@/lib/types";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { COUNTRIES } from "@/lib/countries";
import { componentMeta } from "@/lib/component-meta";
import { compressImage, isImage, makeThumbnail } from "@/lib/image";
import { PHOTO_PREFIX, THUMB_PREFIX, thumbPath } from "@/lib/supabase/config";
import { translateComponentCategory, translateSetupCategory } from "@/lib/category-i18n";
import type { Locale } from "@/lib/i18n/dictionaries";

type Step = 1 | 2 | 3;
type DraftSetup = { title: string; location: string; description: string; isPublished: boolean; categoryIds: string[]; country: string; roomSize: string; hasAcousticTreatment: boolean | null; acousticNotes: string; listeningNotes: string; budgetRange: string };

// Five photos: the first is the cover shown on cards, the rest form the
// gallery on the setup page. Any input size is accepted — compressImage()
// downscales in the browser to what the bucket will take.
const MAX_PHOTOS = 5;

/** A photo is either already in storage (an edit opened on a saved setup)
 *  or still only in memory, waiting for the save that gives it a home. */
type Photo = {
  path: string | null;
  url: string;
  pending: { full: File; thumb: File | null } | null;
};

/** Bytes the browser hands storage, both copies of one photo. */
const uploadName = (ownerId: string, extension: string) =>
  `${ownerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

export function SetupWizard({ categories, isSupabaseReady, ownerId, existing, t, locale }: { categories: Category[]; isSupabaseReady: boolean; ownerId: string | null; existing?: Setup; t: Dictionary; locale: Locale }) {
  const isEdit = Boolean(existing);
  const [step, setStep] = useState<Step>(1);
  const [setup, setSetup] = useState<DraftSetup>({
    title: existing?.title ?? "",
    location: existing?.location ?? "",
    description: existing?.description ?? "",
    isPublished: existing?.isPublished ?? true,
    categoryIds: existing?.categoryIds ?? [],
    country: existing?.country ?? "",
    roomSize: existing?.room.size ?? "",
    hasAcousticTreatment: existing?.room.hasAcousticTreatment ?? null,
    acousticNotes: existing?.room.acousticNotes ?? "",
    listeningNotes: existing?.room.listeningNotes ?? "",
    budgetRange: existing?.room.budgetRange ?? "",
  });
  // Index 0 is always the cover; promoting a photo just moves it to the front.
  const [photos, setPhotos] = useState<Photo[]>(() => {
    // Tiles are small, so show the small copy where one exists.
    const cover = existing?.coverPath && existing?.coverUrl
      ? [{ path: existing.coverPath, url: existing.coverThumbUrl ?? existing.coverUrl, pending: null }] : [];
    const extras = (existing?.gallery ?? []).map((image) => ({ path: image.path, url: image.thumbUrl || image.url, pending: null }));
    return [...cover, ...extras];
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AudioComponent[]>((existing?.components ?? []).filter((c) => !c.isExtra));
  const [extras, setExtras] = useState<AudioComponent[]>((existing?.components ?? []).filter((c) => c.isExtra));
  const [pickerTarget, setPickerTarget] = useState<"chain" | "extra" | null>(null);
  const [detecting, setDetecting] = useState(false);
  // A country outside the list is stored as free text; "__other" is only a UI flag.
  const [customCountry, setCustomCountry] = useState(() => {
    const existingCode = existing?.country ?? "";
    return existingCode && !COUNTRIES.some((country) => country.code === existingCode) ? existingCode : "";
  });
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  // Photos the member took off a saved setup. Their files stay put until the
  // save goes through, because cancelling the edit must leave the live page
  // exactly as it was.
  const droppedPaths = useRef<string[]>([]);

  async function addPhotos(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!chosen.length || !isSupabaseReady || !ownerId) return;
    if (chosen.some((file) => !isImage(file))) { setPhotoError(t.wizard.errFileType); return; }

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { setPhotoError(format(t.wizard.errTooManyPhotos, { max: MAX_PHOTOS })); return; }
    const batch = chosen.slice(0, room);
    setPhotoError(chosen.length > room ? format(t.wizard.errTooManyPhotos, { max: MAX_PHOTOS }) : null);

    setUploadingCover(true);
    for (const file of batch) {
      let ready: File;
      try {
        ready = await compressImage(file);
      } catch {
        setPhotoError(t.wizard.errCompress);
        continue;
      }
      // Nothing goes to storage here. Compressing is the slow part and it still
      // happens now, but the bytes wait in memory until the setup is saved — a
      // photo picked and then thought better of never reaches the bucket, and a
      // closed tab leaves nothing behind to sweep.
      const thumb = await makeThumbnail(ready).catch(() => null);
      const url = URL.createObjectURL(thumb ?? ready);
      setPhotos((current) => (current.length >= MAX_PHOTOS ? current : [...current, { path: null, url, pending: { full: ready, thumb } }]));
    }
    setUploadingCover(false);
  }

  /** Puts the held bytes in the bucket, in the order the tiles are shown.
   *  `stored` is every path the setup should record; `fresh` is the subset this
   *  call created, and the only one safe to undo — the rest are photos the
   *  setup is already published with. */
  async function uploadPending(owner: string): Promise<{ stored: string[]; fresh: string[] }> {
    const supabase = createClient();
    const stored: string[] = [];
    const fresh: string[] = [];
    for (const photo of photos) {
      if (photo.path) { stored.push(photo.path); continue; }
      if (!photo.pending) continue;
      const { full, thumb } = photo.pending;
      const extension = full.type === "image/png" ? "png" : full.type === "image/webp" ? "webp" : "jpg";
      const name = uploadName(owner, extension);
      const path = `${PHOTO_PREFIX}${name}`;
      const { error } = await supabase.storage.from("setup-images").upload(path, full, { upsert: true, contentType: full.type });
      if (error) throw Object.assign(new Error(error.message), { uploaded: fresh });
      stored.push(path);
      fresh.push(path);
      // The small copy lives at the same name under the thumbs prefix, so
      // nothing has to record where it went. A failure here is not fatal:
      // every reader falls back to the full image.
      if (thumb) await supabase.storage.from("setup-images").upload(`${THUMB_PREFIX}${name}`, thumb, { upsert: true, contentType: thumb.type });
    }
    return { stored, fresh };
  }

  /** Takes files back out of the bucket, both copies. Used to undo a half-done
   *  save, and to retire photos dropped from a setup once the save lands. */
  const discard = (paths: string[]) => {
    const fresh = paths.filter(Boolean);
    if (fresh.length === 0) return;
    void createClient().storage.from("setup-images").remove(fresh.flatMap((path) => [path, thumbPath(path)]));
  };

  const makeCover = (index: number) => setPhotos((current) => {
    if (index <= 0 || index >= current.length) return current;
    const next = [...current];
    const [promoted] = next.splice(index, 1);
    return [promoted, ...next];
  });
  /** A photo that never made it to storage just disappears. One that came with
   *  the setup is remembered instead, and its files go only once the save that
   *  drops it actually succeeds. */
  const removePhoto = (index: number) => {
    setPhotoError(null);
    const photo = photos[index];
    if (photo?.pending) URL.revokeObjectURL(photo.url);
    if (photo?.path) droppedPaths.current.push(photo.path);
    setPhotos((current) => current.filter((_, i) => i !== index));
  };

  // Only ask the browser when the member opts in; a denial simply leaves the
  // dropdown untouched rather than guessing.
  async function detectCountry() {
    if (!navigator.geolocation) { setMessage({ type: "error", text: t.wizard.detectFailed }); return; }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
          const data = await response.json();
          const code = data?.countryCode as string | undefined;
          if (code && COUNTRIES.some((country) => country.code === code)) {
            setSetup((current) => ({ ...current, country: code, location: current.location || (data?.city ?? "") }));
          } else {
            setMessage({ type: "error", text: t.wizard.detectFailed });
          }
        } catch {
          setMessage({ type: "error", text: t.wizard.detectFailed });
        }
        setDetecting(false);
      },
      () => { setDetecting(false); setMessage({ type: "error", text: t.wizard.detectFailed }); },
      { timeout: 8000 },
    );
  }

  function toggleCategory(id: string) { setSetup((current) => ({ ...current, categoryIds: current.categoryIds.includes(id) ? current.categoryIds.filter((value) => value !== id) : [...current.categoryIds, id] })); }
  function moveComponent(index: number, direction: -1 | 1) { setSelected((items) => { const next = [...items]; const target = index + direction; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  function removeComponent(id: string) { setSelected((items) => items.filter((item) => item.id !== id)); }

  function goToComponents() {
    if (photos.length === 0) { setPhotoError(t.wizard.errNoPhoto); return; }
    if (!setup.title.trim()) { setMessage({ type: "error", text: t.wizard.errNoTitle }); return; }
    if (!setup.country.trim()) { setMessage({ type: "error", text: t.wizard.errNoCountry }); return; }
    setMessage(null); setStep(2);
  }
  function goToPublish() { if (selected.length === 0) { setMessage({ type: "error", text: t.wizard.errNoComponents }); return; } setMessage(null); setStep(3); }

  async function saveSetup() {
    if (!isSupabaseReady) { setMessage({ type: "error", text: t.auth.envNote }); return; }
    if (photos.length === 0) { setMessage({ type: "error", text: t.wizard.errNoPhoto }); return; }
    if (!ownerId) { setMessage({ type: "error", text: t.auth.envNote }); return; }
    setSaving(true);
    setMessage(null);

    // The photos reach the bucket here, at the last possible moment. Anything
    // that goes in and then cannot be recorded comes straight back out, so a
    // failed save leaves storage exactly as it found it.
    let stored: string[];
    let fresh: string[];
    try {
      ({ stored, fresh } = await uploadPending(ownerId));
    } catch (error) {
      discard((error as { uploaded?: string[] }).uploaded ?? []);
      setSaving(false);
      setMessage({ type: "error", text: (error as Error).message || t.wizard.errUpload });
      return;
    }

    const response = await fetch(isEdit ? `/api/setups/${existing!.slug}` : "/api/setups", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...setup, coverPath: stored[0] ?? null, galleryPaths: stored.slice(1), components: selected, extras }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) { discard(fresh); setMessage({ type: "error", text: payload.error ?? "Error" }); return; }

    // Saved. The photos taken off the setup are no longer reachable from any
    // row, so retire them now rather than leaving them for a sweep later.
    discard(droppedPaths.current);
    droppedPaths.current = [];
    setPhotos(stored.map((path, index) => ({ path, url: photos[index]?.url ?? "", pending: null })));
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
            {photos.length === 0 ? (
              <button type="button" className="cover-dropzone" onClick={() => coverInput.current?.click()} disabled={!isSupabaseReady || uploadingCover}>
                <span className="cover-dropzone-icon">📷</span><span>{t.wizard.dropzone}</span><small>{t.wizard.dropzoneHint}</small>
                {uploadingCover && <small>{t.wizard.compressing}</small>}
              </button>
            ) : null}
            {photos.length === 0 && photoError && <p className="form-error photo-error">{photoError}</p>}
            {photos.length > 0 && (
              <div className="photo-manager">
                <div className="photo-grid">
                  {photos.map((photo, index) => (
                    <div className={index === 0 ? "photo-tile is-cover" : "photo-tile"} key={photo.path}>
                      <img src={photo.url} alt="" />
                      {index === 0
                        ? <span className="photo-flag">{t.wizard.coverBadge}</span>
                        : <button type="button" className="photo-promote" onClick={() => makeCover(index)}>{t.wizard.makeCover}</button>}
                      <button type="button" className="photo-remove" aria-label={t.wizard.removePhoto} onClick={() => removePhoto(index)}>×</button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <button type="button" className="photo-add" onClick={() => coverInput.current?.click()} disabled={uploadingCover}>
                      <span>{uploadingCover ? "…" : "＋"}</span>
                      <small>{uploadingCover ? t.wizard.compressing : t.wizard.addPhotos}</small>
                    </button>
                  )}
                </div>
                {photoError && <p className="form-error photo-error">{photoError}</p>}
                <p className="field-hint photo-hint">{format(t.wizard.photoCount, { n: photos.length, max: MAX_PHOTOS })} · {t.wizard.photoHint}</p>
              </div>
            )}
            <input ref={coverInput} type="file" accept="image/*" multiple hidden onChange={addPhotos} />
            <div className="field"><label htmlFor="setup-title">{t.wizard.title}</label><input id="setup-title" required placeholder={t.wizard.titlePlaceholder} value={setup.title} onChange={(event) => setSetup({ ...setup, title: event.target.value })} /></div>
            <div className="field"><label htmlFor="setup-description">{t.wizard.description}</label><textarea id="setup-description" placeholder={t.wizard.descriptionPlaceholder} value={setup.description} onChange={(event) => setSetup({ ...setup, description: event.target.value })} /></div>
            <div className="two-fields">
              <div className="field"><label htmlFor="setup-location">{t.wizard.city}</label><input id="setup-location" placeholder={t.wizard.cityPlaceholder} value={setup.location} onChange={(event) => setSetup({ ...setup, location: event.target.value })} /></div>
              <div className="field">
                <label htmlFor="setup-country">{t.wizard.country}</label>
                <select
                  id="setup-country"
                  value={customCountry ? "__other" : setup.country}
                  onChange={(event) => {
                    const value = event.target.value;
                    if (value === "__other") { setCustomCountry(setup.country || " "); setSetup({ ...setup, country: "" }); }
                    else { setCustomCountry(""); setSetup({ ...setup, country: value }); }
                  }}
                >
                  <option value="">{t.wizard.countryNone}</option>
                  {COUNTRIES.map((country) => <option key={country.code} value={country.code}>{country[locale]}</option>)}
                  <option value="__other">{t.wizard.countryOther}</option>
                </select>
                {customCountry !== "" && (
                  <input
                    className="country-other"
                    value={customCountry.trim()}
                    onChange={(event) => { setCustomCountry(event.target.value || " "); setSetup({ ...setup, country: event.target.value }); }}
                    placeholder={t.wizard.countryOtherPlaceholder}
                  />
                )}
                <button type="button" className="text-link detect-link" onClick={detectCountry} disabled={detecting}>
                  {detecting ? t.wizard.detecting : t.wizard.detectLocation}
                </button>
              </div>
            </div>
            <div className="field"><label htmlFor="setup-visibility">{t.wizard.visibility}</label><select id="setup-visibility" value={setup.isPublished ? "public" : "private"} onChange={(event) => setSetup({ ...setup, isPublished: event.target.value === "public" })}><option value="public">{t.wizard.visibilityPublic}</option><option value="private">{t.wizard.visibilityPrivate}</option></select></div>
            <div className="field"><label>{t.wizard.category}</label><div className="type-options">{categories.map((category) => <button key={category.id} type="button" className={`type-option ${setup.categoryIds.includes(category.id) ? "active" : ""}`} onClick={() => toggleCategory(category.id)}>{translateSetupCategory(category.name, locale)}</button>)}</div></div>
            {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
            <button className="button button-dark" type="button" onClick={goToComponents}>{t.wizard.next1} <span>→</span></button>
          </section>
        )}

        {step === 2 && (
          <section className="form-section">
            <h2>{t.wizard.componentsStep}</h2>
            <p className="eyebrow">{t.wizard.mainChain}</p>
            {pickerTarget !== "chain" && <button className="button button-outline button-small" type="button" onClick={() => setPickerTarget("chain")}>{t.wizard.addComponent}</button>}
            {pickerTarget === "chain" && <ComponentPicker onAdd={(component) => setSelected((items) => [...items, component])} onClose={() => setPickerTarget(null)} t={t} locale={locale} />}
            {selected.length > 0 && (
              <div className="draft-components">
                <p className="chain-hint">{t.wizard.chainHint}</p>
                {selected.map((item, index) => (
                  <div className="draft-component chain-editable" key={`${item.id}-${index}`}>
                    <span className="component-icon" aria-hidden="true">{componentMeta(item.category).icon}</span>
                    <div><b>{item.brand} {item.model}</b><small>{translateComponentCategory(item.category, locale)}</small></div>
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

            <div className="extras-block">
              <p className="eyebrow">{t.wizard.extras}</p>
              <p className="chain-hint">{t.wizard.extrasHint}</p>
              {pickerTarget !== "extra" && <button className="button button-outline button-small" type="button" onClick={() => setPickerTarget("extra")}>{t.wizard.addExtra}</button>}
              {pickerTarget === "extra" && <ComponentPicker onAdd={(component) => setExtras((items) => [...items, component])} onClose={() => setPickerTarget(null)} t={t} locale={locale} />}
              {extras.length > 0 && (
                <div className="draft-components">
                  {extras.map((item, index) => (
                    <div className="draft-component is-extra" key={`${item.id}-extra-${index}`}>
                      <span className="component-icon" aria-hidden="true">{componentMeta(item.category).icon}</span>
                      <div><b>{item.brand} {item.model}</b><small>{translateComponentCategory(item.category, locale)}</small></div>
                      <OriginBadge origin={item.origin} t={t} />
                      <button className="remove" type="button" aria-label={`${t.wizard.remove} ${item.model}`} onClick={() => setExtras((items) => items.filter((_, i) => i !== index))}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                      {t.wizard.budgets.map((budget) => <option key={budget}>{budget}</option>)}
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
                  <div className="summary-row"><span>{t.wizard.summaryCover}</span><strong>{photos.length ? format(t.wizard.photoCount, { n: photos.length, max: MAX_PHOTOS }) : t.wizard.summaryCoverNo}</strong></div>
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
        {photos[0] ? <div className="preview-art preview-art-photo" style={{ backgroundImage: `url(${photos[0].url})`, backgroundSize: "cover", backgroundPosition: "center" }} /> : <div className="preview-art" />}
        <h2>{setup.title || t.wizard.previewTitle}</h2>
        <p className="byline">{setup.location || t.wizard.previewCity} · {setup.isPublished ? t.wizard.previewPublic : t.wizard.previewPrivate}</p>
        {setup.categoryIds.length > 0 && <div className="setup-tags">{categories.filter((category) => setup.categoryIds.includes(category.id)).map((category) => <span className="setup-tag" key={category.id}>{translateSetupCategory(category.name, locale)}</span>)}</div>}
        <div className="preview-stat"><span>{t.wizard.statComponents}</span><span>{selected.length}</span></div>
        <div className="preview-stat"><span>{t.wizard.statSpecial}</span><span>{selected.filter((item) => item.origin !== "standard").length}</span></div>
      </aside>
    </div>
  );
}
