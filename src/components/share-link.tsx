"use client";

import { useState } from "react";

export function ShareLink({ title, compact = false }: { title?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share(network: "telegram" | "facebook" | "x") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title ?? "Подивіться на цей Hi-Fi сетап");
    const targets = {
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    };
    window.open(targets[network], "_blank", "noopener,noreferrer,width=600,height=520");
  }

  if (compact) return <button type="button" className="button button-outline button-small" onClick={copy}>{copied ? "Скопійовано ✓" : "Поділитися"}</button>;

  return (
    <div className="share-row">
      <button type="button" className="button button-outline button-small" onClick={copy}>{copied ? "Скопійовано ✓" : "Копіювати посилання"}</button>
      <button type="button" className="share-icon" onClick={() => share("telegram")} aria-label="Поділитися в Telegram">✈</button>
      <button type="button" className="share-icon" onClick={() => share("facebook")} aria-label="Поділитися у Facebook">f</button>
      <button type="button" className="share-icon" onClick={() => share("x")} aria-label="Поділитися в X">𝕏</button>
    </div>
  );
}
