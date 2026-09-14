"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-ink/10 bg-surface/60 px-3 py-1 font-recoleta text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
    >
      {copied ? "copied!" : "copy"}
    </button>
  );
}
