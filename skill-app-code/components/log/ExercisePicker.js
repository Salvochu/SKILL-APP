"use client";

import { useEffect, useMemo, useState } from "react";
import MusclePill from "@/components/MusclePill";
import VideoModal from "@/components/log/VideoModal";
import { MUSCLE_ORDER, sortEquipment, muscleKey } from "@/lib/exercises";

// Every muscle an exercise touches, primary first; falls back to the
// parent-group name when a row has no tags.
function tagsFor(e) {
  if (e.muscles && e.muscles.length) return e.muscles;
  return e.muscle ? [{ id: e.muscle, name: e.muscle, parent: e.muscle, role: "primary" }] : [];
}

export default function ExercisePicker({ exercises, onPick, onClose, title = "Add exercise" }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [previewFor, setPreviewFor] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const groups = useMemo(() => {
    const present = new Set(exercises.flatMap((e) => tagsFor(e).map((m) => m.parent)));
    return MUSCLE_ORDER.filter((g) => present.has(g));
  }, [exercises]);

  const equipmentList = useMemo(
    () => sortEquipment([...new Set(exercises.map((e) => e.equipment).filter(Boolean))]),
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises
      .filter((e) => {
        if (group !== "All" && !tagsFor(e).some((m) => m.parent === group)) return false;
        if (equipment !== "All" && e.equipment !== equipment) return false;
        if (q && !e.name.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice(0, 80);
  }, [exercises, query, group, equipment]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-surface sm:rounded-2xl">
        <div className="flex flex-col gap-3 border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-fg">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-field p-1.5 text-dim hover:text-fg">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
          />
          {groups.length > 0 ? (
            <ChipRow value={group} onChange={setGroup} options={groups} allLabel="All muscles" dots />
          ) : null}
          {equipmentList.length > 0 ? (
            <ChipRow value={equipment} onChange={setEquipment} options={equipmentList} allLabel="All equipment" />
          ) : null}
        </div>
        <ul className="flex flex-col gap-2 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="flex items-stretch overflow-hidden rounded-card border border-border bg-bg/40 transition-colors hover:border-border-strong"
            >
              {e.video_url ? (
                <button
                  type="button"
                  onClick={() => setPreviewFor(e)}
                  aria-label={`Watch ${e.name} form video`}
                  className="flex shrink-0 items-center border-r border-border px-3 text-accent transition-colors hover:bg-accent-soft"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft">
                    <IconPlay className="ml-0.5 h-3.5 w-3.5" />
                  </span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onPick(e)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2 active:bg-accent-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-fg">{e.name}</span>
                  <span className="block text-xs text-dim">{e.equipment}</span>
                </span>
                <MusclePill muscle={e.muscles?.find((m) => m.role === "primary")?.name ?? e.muscle} />
              </button>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted">No exercises match those filters.</li>
          ) : null}
        </ul>
      </div>
      {previewFor ? <VideoModal exercise={previewFor} onClose={() => setPreviewFor(null)} /> : null}
    </div>
  );
}

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ChipRow({ value, onChange, options, allLabel, dots }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
