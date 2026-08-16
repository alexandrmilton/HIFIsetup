"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { OriginBadge } from "@/components/origin-badge";
import { ComponentPicker } from "@/components/component-picker";
import type { AudioComponent, Category, Setup } from "@/lib/types";

type Step = 1 | 2 | 3;
type DraftSetup = { title: string; location: string; description: string; isPublished: boolean; categoryIds: string[]; roomSize: string; hasAcousticTreatment: boolean | null; acousticNotes: string; listeningNotes: string; budgetRange: string };

const stepLabels: Record<Step, string> = { 1: "Інформація", 2: "Компоненти", 3: "Публікація" };

// Keep covers small enough to stay within the free storage tier while still
// looking sharp on a retina card. The bucket enforces the same ceiling.
const MAX_COVER_MB = 4;
const MAX_COVER_BYTES = MAX_COVER_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function SetupWizard({ categories, isSupabaseReady, ownerId, existing }: { categories: Category[]; isSupabaseReady: boolean; ownerId: string | null; existing?: Setup }) {
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
    if (!ALLOWED_TYPES.includes(file.type)) { setMessage({ type: "error", text: "Підтримуються лише JPG, PNG або WebP." }); return; }
    if (file.size > MAX_COVER_BYTES) { setMessage({ type: "error", text: `Файл завеликий (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум ${MAX_COVER_MB} МБ.` }); return; }

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

  function goToComponents() { if (!setup.title.trim()) { setMessage({ type: "error", text: "Вкажіть назву сетапу." }); return; } setMessage(null); setStep(2); }
  function goToPublish() { if (selected.length === 0) { setMessage({ type: "error", text: "Додайте хоча б один компонент." }); return; } setMessage(null); setStep(3); }

  async function saveSetup() {
    if (!isSupabaseReady) { setMessage({ type: "error", text: "Додайте ключі Supabase у .env.local, щоб зберігати сетапи." }); return; }
    setSaving(true);
    setMessage(null);
    const response = await fetch(isEdit ? `/api/setups/${existing!.slug}` : "/api/setups", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...setup, coverPath, components: selected }),
    });
    const payload = await response.json();
    setSaving(false);
    if (!response.ok) { setMessage({ type: "error", text: payload.error ?? "Не вдалося зберегти сетап." }); return; }
    setSavedSlug(payload.slug);
    setMessage({ type: "success", text: isEdit ? "Зміни збережено. Сетап знову на модерації." : "Сетап надіслано на модерацію." });
  }

  return (
    <div className="builder-shell">
      <div className="builder-card">
        <div className="wizard-steps">
          <span className={step === 1 ? "wizard-step active" : "wizard-step done"}><b>1</b><em>{stepLabels[1]}</em></span>
          <span className="wizard-step-line" />
          <span className={step === 2 ? "wizard-step active" : step > 2 ? "wizard-step done" : "wizard-step"}><b>2</b><em>{stepLabels[2]}</em></span>
          <span className="wizard-step-line" />
          <span className={step === 3 ? "wizard-step active" : "wizard-step"}><b>3</b><em>{stepLabels[3]}</em></span>
        </div>

        {step === 1 && (
          <section className="form-section">
            <h2>1. Про сетап</h2>
            <button type="button" className="cover-dropzone" onClick={() => coverInput.current?.click()} disabled={!isSupabaseReady}>
              {coverPreview ? <img src={coverPreview} alt="" /> : <><span className="cover-dropzone-icon">📷</span><span>Додайте фото вашого сетапу</span><small>JPG, PNG або WebP · до {MAX_COVER_MB} МБ</small></>}
              {uploadingCover && <small>Завантажуємо…</small>}
            </button>
            <input ref={coverInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={uploadCover} />
            <div className="field"><label htmlFor="setup-title">Назва</label><input id="setup-title" required placeholder="Напр. Музика після дощу" value={setup.title} onChange={(event) => setSetup({ ...setup, title: event.target.value })} /></div>
            <div className="field"><label htmlFor="setup-description">Опис (необов'язково)</label><textarea id="setup-description" placeholder="Розкажіть про ваш сетап, враження, особливості…" value={setup.description} onChange={(event) => setSetup({ ...setup, description: event.target.value })} /></div>
            <div className="two-fields">
              <div className="field"><label htmlFor="setup-location">Місто</label><input id="setup-location" placeholder="Львів" value={setup.location} onChange={(event) => setSetup({ ...setup, location: event.target.value })} /></div>
              <div className="field"><label htmlFor="setup-visibility">Видимість</label><select id="setup-visibility" value={setup.isPublished ? "public" : "private"} onChange={(event) => setSetup({ ...setup, isPublished: event.target.value === "public" })}><option value="public">Публічний — видно всім на сайті</option><option value="private">Приватний — видно лише за посиланням</option></select></div>
            </div>
            <div className="field"><label>Категорія / напрямок</label><div className="type-options">{categories.map((category) => <button key={category.id} type="button" className={`type-option ${setup.categoryIds.includes(category.id) ? "active" : ""}`} onClick={() => toggleCategory(category.id)}>{category.name}</button>)}</div></div>
            {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
            <button className="button button-dark" type="button" onClick={goToComponents}>Далі: Додати компоненти <span>→</span></button>
          </section>
        )}

        {step === 2 && (
          <section className="form-section">
            <h2>2. Компоненти</h2>
            {!showPicker && <button className="button button-outline button-small" type="button" onClick={() => setShowPicker(true)}>＋ Додати компонент</button>}
            {showPicker && <ComponentPicker onAdd={(component) => setSelected((items) => [...items, component])} onClose={() => setShowPicker(false)} />}
            {selected.length > 0 && (
              <div className="draft-components">
                <p className="eyebrow" style={{ marginTop: 18 }}>Схема підключення — перший компонент першим у ланцюгу</p>
                {selected.map((item, index) => (
                  <div className="draft-component chain-editable" key={item.id}>
                    <span className="component-thumb" />
                    <div><b>{item.brand} {item.model}</b><small>{item.category}</small></div>
                    <OriginBadge origin={item.origin} />
                    <div className="chain-move">
                      <button type="button" className="chain-move-btn" aria-label="Вище" onClick={() => moveComponent(index, -1)} disabled={index === 0}>↑</button>
                      <button type="button" className="chain-move-btn" aria-label="Нижче" onClick={() => moveComponent(index, 1)} disabled={index === selected.length - 1}>↓</button>
                    </div>
                    <button className="remove" type="button" aria-label={`Прибрати ${item.model}`} onClick={() => removeComponent(item.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
            {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
            <div className="wizard-nav"><button className="button button-outline button-small" type="button" onClick={() => setStep(1)}>Назад</button><button className="button button-dark" type="button" onClick={goToPublish}>Далі: Публікація <span>→</span></button></div>
          </section>
        )}

        {step === 3 && (
          <section className="form-section">
            <h2>3. Кімната та публікація</h2>
            {savedSlug ? (
              <div className="publish-done">
                <div className="moderation-notice">
                  <span className="moderation-notice-icon" aria-hidden="true">🕓</span>
                  <div>
                    <strong>Сетап надіслано на модерацію</strong>
                    <p>Щойно модератор його схвалить, сетап зʼявиться на головній сторінці, а посилання нижче стане доступним для всіх. Ви завжди бачите його у своєму профілі.</p>
                  </div>
                </div>
                <div className="publish-share">
                  <p className="eyebrow">Посилання на сетап</p>
                  <code className="publish-url">{typeof window !== "undefined" ? `${window.location.origin}/setups/${savedSlug}` : `/setups/${savedSlug}`}</code>
                </div>
                <div className="wizard-nav">
                  <a className="button button-dark" href={`/setups/${savedSlug}`}>Переглянути сетап <span>→</span></a>
                  <a className="button button-outline button-small" href="/profile">Мої сетапи</a>
                </div>
              </div>
            ) : (
              <>
                <p className="publish-lede">Ці деталі допомагають іншим зрозуміти, як звучить ваша система. Усі поля необовʼязкові.</p>

                <div className="two-fields">
                  <div className="field"><label htmlFor="room-size">Розмір кімнати</label><input id="room-size" placeholder="Напр. 4 × 5 м, 18 м²" value={setup.roomSize} onChange={(event) => setSetup({ ...setup, roomSize: event.target.value })} /></div>
                  <div className="field"><label htmlFor="budget-range">Приблизний бюджет</label>
                    <select id="budget-range" value={setup.budgetRange} onChange={(event) => setSetup({ ...setup, budgetRange: event.target.value })}>
                      <option value="">Не вказувати</option>
                      <option>до $500</option>
                      <option>$500 – $1 500</option>
                      <option>$1 500 – $5 000</option>
                      <option>$5 000 – $15 000</option>
                      <option>понад $15 000</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Акустична обробка кімнати</label>
                  <div className="type-options">
                    <button type="button" className={`type-option ${setup.hasAcousticTreatment === true ? "active" : ""}`} onClick={() => setSetup({ ...setup, hasAcousticTreatment: true })}>Так, є</button>
                    <button type="button" className={`type-option ${setup.hasAcousticTreatment === false ? "active" : ""}`} onClick={() => setSetup({ ...setup, hasAcousticTreatment: false })}>Немає</button>
                    <button type="button" className={`type-option ${setup.hasAcousticTreatment === null ? "active" : ""}`} onClick={() => setSetup({ ...setup, hasAcousticTreatment: null })}>Не вказувати</button>
                  </div>
                </div>

                {setup.hasAcousticTreatment === true && (
                  <div className="field"><label htmlFor="acoustic-notes">Що саме зроблено</label><textarea id="acoustic-notes" placeholder="Басові пастки в кутах, панелі в точках першого відбиття, килим…" value={setup.acousticNotes} onChange={(event) => setSetup({ ...setup, acousticNotes: event.target.value })} /></div>
                )}

                <div className="field"><label htmlFor="listening-notes">Враження від звучання</label><textarea id="listening-notes" placeholder="Як звучить система, під яку музику зібрана, що плануєте змінити…" value={setup.listeningNotes} onChange={(event) => setSetup({ ...setup, listeningNotes: event.target.value })} /></div>

                <div className="publish-summary">
                  <p className="eyebrow">Перед публікацією</p>
                  <div className="summary-row"><span>Назва</span><strong>{setup.title || "—"}</strong></div>
                  <div className="summary-row"><span>Компоненти</span><strong>{selected.length}</strong></div>
                  <div className="summary-row"><span>Категорії</span><strong>{setup.categoryIds.length || "—"}</strong></div>
                  <div className="summary-row"><span>Обкладинка</span><strong>{coverPath ? "Завантажено" : "Немає"}</strong></div>
                  <div className="summary-row"><span>Видимість</span><strong>{setup.isPublished ? "Публічний" : "Приватний"}</strong></div>
                </div>

                {message && <p className={message.type === "error" ? "form-error" : "form-success"}>{message.text}</p>}
                <div className="wizard-nav"><button className="button button-outline button-small" type="button" onClick={() => setStep(2)}>Назад</button><button className="button button-dark" type="button" onClick={saveSetup} disabled={saving}>{saving ? "Зберігаємо…" : isEdit ? "Зберегти зміни" : "Надіслати на модерацію"} <span>→</span></button></div>
              </>
            )}
          </section>
        )}
      </div>

      <aside className="preview-card">
        <h3>Попередній перегляд</h3>
        {coverPreview ? <div className="preview-art preview-art-photo" style={{ backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" }} /> : <div className="preview-art" />}
        <h2>{setup.title || "Назва вашого сетапу"}</h2>
        <p className="byline">{setup.location || "Ваше місто"} · {setup.isPublished ? "публічно" : "приватно"}</p>
        {setup.categoryIds.length > 0 && <div className="setup-tags">{categories.filter((category) => setup.categoryIds.includes(category.id)).map((category) => <span className="setup-tag" key={category.id}>{category.name}</span>)}</div>}
        <div className="preview-stat"><span>Компоненти</span><span>{selected.length}</span></div>
        <div className="preview-stat"><span>Особливі</span><span>{selected.filter((item) => item.origin !== "standard").length}</span></div>
      </aside>
    </div>
  );
}
