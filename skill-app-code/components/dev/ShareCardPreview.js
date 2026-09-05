"use client";

import { useState } from "react";
import { buildShareImageBlob } from "@/lib/shareCard";

// design-preview only: renders the generated share-card PNG inline so it
// can be reviewed without going through a real save (which needs a real
// session design-preview does not have).
export default function ShareCardPreview() {
  const [url, setUrl] = useState(null);

  async function generate() {
    const blob = await buildShareImageBlob({ volumeLabel: "800 kg", timeLabel: "7m", effortLabel: "Very hard" });
    setUrl(URL.createObjectURL(blob));
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={generate}
        className="self-start rounded-field border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2"
      >
        Generate share card
      </button>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Share card preview" className="w-64 rounded-card border border-border" />
      ) : null}
    </div>
  );
}
