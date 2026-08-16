"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function ShareLink({ title, t }: { title?: string; t: Dictionary }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function share(network: "telegram" | "facebook" | "x") {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title ?? "HiFiSetup");
    const targets = {
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    };
    window.open(targets[network], "_blank", "noopener,noreferrer,width=600,height=520");
  }

  return (
    <div className="share-row">
      <button type="button" className="button button-outline button-small" onClick={copy}>{copied ? t.setup.copied : t.setup.copyLink}</button>
      <button type="button" className="share-icon" onClick={() => share("telegram")} aria-label="Telegram">✈</button>
      <button type="button" className="share-icon" onClick={() => share("facebook")} aria-label="Facebook">f</button>
      <button type="button" className="share-icon" onClick={() => share("x")} aria-label="X">𝕏</button>
    </div>
  );
}
