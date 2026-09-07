"use client";

import { useState } from "react";
import { buildShareImageBlob } from "@/lib/shareCard";
import { buildProgressShareBlob } from "@/lib/progressShare";

// design-preview only: renders the generated share-card PNG inline so it
// can be reviewed without going through a real save (which needs a real
// session design-preview does not have).
export default function ShareCardPreview() {
  const [url, setUrl] = useState(null);
  const [purl, setPurl] = useState(null);

  async function generate() {
    const blob = await buildShareImageBlob({ volumeLabel: "800 kg", timeLabel: "7m", effortLabel: "Very hard" });
    setUrl(URL.createObjectURL(blob));
  }
  async function generateProgress() {
    const blob = await buildProgressShareBlob({
      rangeLabel: "Last 8 weeks",
      stats: [
        ["Total volume", "48k kg"],
        ["Workouts", "16"],
        ["Top est. 1RM", "142 kg"],
      ],
      muscles: [
        { name: "Quads", value: 14 },
        { name: "Back", value: 12.5 },
        { name: "Chest", value: 11 },
        { name: "Glutes", value: 9 },
        { name: "Shoulders", value: 8.5 },
        { name: "Hamstrings", value: 6 },
      ],
    });
    setPurl(URL.createObjectURL(blob));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={generate}
          className="self-start rounded-field border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2"
        >
          Workout card
        </button>
        <button
          type="button"
          onClick={generateProgress}
          className="self-start rounded-field border border-border px-4 py-2 text-sm font-medium text-fg hover:bg-surface-2"
        >
          Progress card
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Workout share card preview" className="w-64 rounded-card border border-border" />
        ) : null}
        {purl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={purl} alt="Progress share card preview" className="w-64 rounded-card border border-border" />
        ) : null}
      </div>
    </div>
  );
}
