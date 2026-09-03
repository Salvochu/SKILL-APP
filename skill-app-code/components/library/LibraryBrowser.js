"use client";

import { useMemo, useState } from "react";
import { sortMuscles, sortEquipment, muscleKey } from "@/lib/exercises";
import ExerciseSheet from "@/components/library/ExerciseSheet";
import MusclePill from "@/components/MusclePill";

export default function LibraryBrowser({ exercises }) {
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [openId, setOpenId] = useState(null);

  const muscles = useMemo(
    () => sortMuscles([...new Set(exercises.map((e) => e.muscle))]),
    [exercises],
  );
  const equipmentList = useMemo(
    () => sortEquipment([...new Set(exercises.map((e) => e.equipment))]),
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (muscle !== "All" && e.muscle !== muscle) return false;
      if (equipment !== "All" && e.equipment !== equipment) return false;
      if (q && !(`${e.name} ${e.instructions ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [exercises, query, muscle, equipment]);

  const open = exercises.find((e) => e.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search exercises or instructions"
        className="w-full rounded-field border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-dim focus:border-accent"
      />

      <ChipRow value={muscle} onChange={setMuscle} options={muscles} allLabel="All muscles" dots />
      <ChipRow value={equipment} onChange={setEquipment} options={equipmentList} allLabel="All equipment" />

      <p className="text-xs text-dim">
        {filtered.length} {filtered.length === 1 ? "exercise" : "exercises"}
      </p>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No exercises match those filters.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpenId(e.id)}
                className="flex w-full flex-col gap-1.5 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-2"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-display text-base font-semibold text-fg">{e.name}</span>
                  {e.video_url ? <IconPlay className="mt-1 h-4 w-4 shrink-0 text-dim" /> : null}
                </span>
                <span className="flex flex-wrap gap-2">
                  <MusclePill muscle={e.muscle} />
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
                    {e.equipment}
                  </span>
                </span>
                {e.instructions ? (
                  <span className="line-clamp-2 text-sm text-muted">{e.instructions}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? <ExerciseSheet exercise={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}

function ChipRow({ value, onChange, options, allLabel, dots }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {["All", ...options].map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === opt
              ? "border-accent bg-accent-soft text-accent"
              : "border-border text-muted hover:text-fg"
          }`}
        >
          {dots && opt !== "All" ? (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: `var(--muscle-${muscleKey(opt)})` }}
            />
          ) : null}
          {opt === "All" ? allLabel : opt}
        </button>
      ))}
    </div>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
