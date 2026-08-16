"use client";

import { useEffect, useState } from "react";
import { OriginBadge } from "@/components/origin-badge";
import type { AudioComponent, ComponentOrigin } from "@/lib/types";
import { format, type Dictionary } from "@/lib/i18n/dictionaries";
import { COMPONENT_CATEGORIES as categories, componentMeta } from "@/lib/component-meta";

type SubStep = "search" | "details" | "added";

// Category list lives with the icon map so the two never drift apart.

export function ComponentPicker({ onAdd, onClose, t }: { onAdd: (component: AudioComponent) => void; onClose: () => void; t: Dictionary }) {
  const [subStep, setSubStep] = useState<SubStep>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AudioComponent[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<AudioComponent | null>(null);
  const [manual, setManual] = useState({ brand: "", model: "", category: categories[0], origin: "standard" as ComponentOrigin });

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const response = await fetch(`/api/components?q=${encodeURIComponent(query)}`);
      setResults(response.ok ? await response.json() : []);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  // A catalog hit already carries every field, so it is added on the single
  // click; only manual entry needs the details step.
  function pickFromCatalog(component: AudioComponent) { setPicked(component); onAdd(component); setSubStep("added"); }
  function startManual() { setPicked(null); setManual({ brand: query, model: "", category: categories[0], origin: "standard" }); setSubStep("details"); }

  function confirm() {
    const component: AudioComponent = { id: `new-${crypto.randomUUID()}`, brand: manual.brand.trim(), model: manual.model.trim(), category: manual.category, origin: manual.origin };
    if (!component.brand || !component.model) return;
    onAdd(component);
    setPicked(component);
    setSubStep("added");
  }

  function addAnother() { setPicked(null); setQuery(""); setResults([]); setManual({ brand: "", model: "", category: categories[0], origin: "standard" }); setSubStep("search"); }

  return (
    <div className="picker-card">
      <div className="picker-head">
        <p className="eyebrow">{t.picker.heading}</p>
        <button type="button" className="text-link" onClick={onClose}>{t.picker.close}</button>
      </div>
      <div className="wizard-steps wizard-steps-mini">
        <span className={subStep === "search" ? "wizard-step active" : "wizard-step done"}><b>1</b><em>{t.picker.step1}</em></span>
        <span className="wizard-step-line" />
        <span className={subStep === "details" ? "wizard-step active" : subStep === "added" ? "wizard-step done" : "wizard-step"}><b>2</b><em>{t.picker.step2}</em></span>
        <span className="wizard-step-line" />
        <span className={subStep === "added" ? "wizard-step active" : "wizard-step"}><b>3</b><em>{t.picker.step3}</em></span>
      </div>

      {subStep === "search" && (
        <div className="component-search">
          <div className="field"><label htmlFor="component-query">{t.picker.queryLabel}</label><input id="component-query" className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.picker.queryPlaceholder} autoFocus /></div>
          {query.trim() && (
            <div className="search-results-static">
              {searching && <div className="search-empty">{t.picker.searching}</div>}
              {!searching && results.map((item) => <button className="search-result" key={item.id} type="button" onClick={() => pickFromCatalog(item)}><span className="component-icon" aria-hidden="true">{componentMeta(item.category).icon}</span><span><b>{item.brand} {item.model}</b><small>{item.category}</small></span><OriginBadge origin={item.origin} t={t} /></button>)}
              {!searching && results.length === 0 && <div className="search-empty">{t.picker.noMatch}</div>}
              <button type="button" className="text-link picker-manual-link" onClick={startManual}>{t.picker.manual}</button>
            </div>
          )}
        </div>
      )}

      {subStep === "details" && (
        <div className="picker-details">
          <div className="two-fields">
            <div className="field"><label htmlFor="manual-brand">{t.picker.brand}</label><input id="manual-brand" value={manual.brand} onChange={(event) => setManual({ ...manual, brand: event.target.value })} placeholder={t.picker.brandPlaceholder} /></div>
            <div className="field"><label htmlFor="manual-model">{t.picker.model}</label><input id="manual-model" value={manual.model} onChange={(event) => setManual({ ...manual, model: event.target.value })} placeholder={t.picker.modelPlaceholder} /></div>
          </div>
          <div className="field"><label htmlFor="manual-category">{t.picker.category}</label><select id="manual-category" value={manual.category} onChange={(event) => setManual({ ...manual, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
          <div className="field"><label>{t.picker.origin}</label><div className="type-options">{(["standard", "handmade", "custom_order"] as ComponentOrigin[]).map((type) => <button key={type} className={`type-option type-option-${type} ${manual.origin === type ? "active" : ""}`} type="button" onClick={() => setManual({ ...manual, origin: type })}>{type === "standard" ? t.picker.standard : type === "handmade" ? t.picker.handmade : t.picker.custom}</button>)}</div></div>
          <button className="button button-dark button-small" type="button" onClick={confirm} disabled={!manual.brand.trim() || !manual.model.trim()}>{t.picker.add}</button>
        </div>
      )}

      {subStep === "added" && (
        <div className="picker-added">
          <p className="form-success">{picked ? format(t.picker.added, { name: `${picked.brand} ${picked.model}` }) : t.picker.addedGeneric}</p>
          <div className="picker-added-actions"><button className="button button-outline button-small" type="button" onClick={addAnother}>{t.picker.addMore}</button><button className="button button-dark button-small" type="button" onClick={onClose}>{t.picker.done}</button></div>
        </div>
      )}
    </div>
  );
}
