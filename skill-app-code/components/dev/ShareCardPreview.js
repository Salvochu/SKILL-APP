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
      levelLabel: "Level 34",
      tierLabel: "Sapphire",
      tierColor: "#3f86d9",
      xpPct: 62,
      stats: [
        ["Workouts", "128"],
        ["kg lifted", "412k"],
        ["Trained", "71h"],
      ],
      muscles: [
        { name: "Legs", sets: 148 },
        { name: "Back", sets: 121 },
        { name: "Chest", sets: 96 },
        { name: "Shoulders", sets: 74 },
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
