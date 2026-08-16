"use client";

import { useState } from "react";

export function ShareLink() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return <button type="button" className="button button-outline button-small share-link" onClick={copy}>{copied ? "Скопійовано ✓" : "Скопіювати посилання"}</button>;
}
