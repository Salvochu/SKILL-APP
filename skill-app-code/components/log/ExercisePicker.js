"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import VideoModal from "@/components/log/VideoModal";
import { MUSCLE_ORDER, sortEquipment, muscleKey, exerciseSearchScore } from "@/lib/exercises";

// Every muscle an exercise touches, primary first; falls back to the
// parent-group name when a row has no tags.
function tagsFor(e) {
  if (e.muscles && e.muscles.length) return e.muscles;
  return e.muscle ? [{ id: e.muscle, name: e.muscle, parent: e.muscle, role: "primary" }] : [];
}

// `multiple` turns the picker into a checklist: tap rows to select, then
// confirm to add them all at once. Off (swap, or a single add) keeps the
// tap-to-pick behaviour.
export default function ExercisePicker({
  exercises,
  onPick,
  onClose,
  title = "Add exercise",
  multiple = false,
}) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [previewFor, setPreviewFor] = useState(null);
  const [selected, setSelected] = useState(() => new Set());

  const byId = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);

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
    const q = query.trim();
    const scored = [];
    for (const e of exercises) {
      if (group !== "All" && !tagsFor(e).some((m) => m.parent === group)) continue;
      if (equipment !== "All" && e.equipment !== equipment) continue;
      if (q) {
        const score = exerciseSearchScore(e.name, q);
        if (score == null) continue;
        scored.push({ e, score });
      } else {
        scored.push({ e, score: 0 });
      }
    }
    if (q) scored.sort((a, b) => a.score - b.score || a.e.name.localeCompare(b.e.name));
    return scored.slice(0, 120).map((s) => s.e);
  }, [exercises, query, group, equipment]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function pickRow(e) {
    if (multiple) toggle(e.id);
    else onPick(e);
  }

  // Press and hold a row to open its video preview, same destination as
  // the play button. A timer starts on press; if it fires before the
  // press is released, the click that follows is swallowed so it does
  // not also pick/select the row.
  const pressTimer = useRef(null);
  const longPressed = useRef(false);
  const LONG_PRESS_MS = 450;

  function startLongPress(e) {
    if (!e.video_url) return;
    longPressed.current = false;
    pressTimer.current = setTimeout(() => {
      longPressed.current = true;
      setPreviewFor(e);
    }, LONG_PRESS_MS);
  }
  function cancelLongPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }
  function handleRowClick(e) {
    if (longPressed.current) {
      longPressed.current = false;
      return;
    }
    pickRow(e);
  }

  function confirmMulti() {
    [...selected].map((id) => byId.get(id)).filter(Boolean).forEach((e) => onPick(e));
    onClose();
  }

  const swapping = /swap/i.test(title);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-fg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition-[color,transform] hover:text-fg active:scale-90"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <label className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 focus-within:ring-2 focus-within:ring-accent/60">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-dim" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises"
            aria-label="Search exercises"
            className="w-full min-w-0 bg-transparent py-2.5 text-[16px] text-fg outline-none placeholder:text-dim"
          />
        </label>
        {groups.length > 0 ? (
          <ChipRow value={group} onChange={setGroup} options={groups} allLabel="All muscles" dots />
        ) : null}
        {equipmentList.length > 0 ? (
          <ChipRow value={equipment} onChange={setEquipment} options={equipmentList} allLabel="All equipment" />
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {/* One grouped list, hairlines between rows. */}
        <ul className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-surface [&>li+li]:border-t [&>li+li]:border-border/70">
          {filtered.map((e) => {
            const isSel = multiple && selected.has(e.id);
            const primary = e.muscles?.find((m) => m.role === "primary")?.name ?? e.muscle;
            return (
              <li key={e.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleRowClick(e)}
                  onPointerDown={() => startLongPress(e)}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onPointerCancel={cancelLongPress}
                  aria-pressed={multiple ? isSel : undefined}
                  className={`flex w-full items-center gap-3 py-3 pl-[60px] pr-4 text-left transition-colors active:bg-surface-2 ${
                    isSel ? "bg-accent-soft" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] font-semibold text-fg">{e.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-dim">
                      {primary ? (
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: `var(--muscle-${muscleKey(primary)})` }}
                        />
                      ) : null}
                      <span className="truncate">
                        {primary}
                        {e.equipment ? ` · ${e.equipment}` : ""}
                      </span>
                    </span>
                  </span>
                  {multiple ? (
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isSel ? "check-pop bg-accent text-black" : "text-transparent ring-[1.5px] ring-inset ring-border-strong"
                      }`}
                    >
                      <IconCheck className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </button>
                {e.video_url ? (
                  <button
                    type="button"
                    onClick={() => setPreviewFor(e)}
                    aria-label={`Watch ${e.name} form video`}
                    className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-accent-soft text-accent transition-transform active:scale-90"
                  >
                    <IconPlay className="ml-0.5 h-3.5 w-3.5" />
                  </button>
                ) : (
                  // No video: a quiet placeholder in the same spot, so every
                  // name lines up down the list.
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-dim" />
                  </span>
                )}
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-[15px] text-muted">No exercises match those filters.</li>
          ) : null}
        </ul>
      </div>

      {multiple ? (
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={confirmMulti}
            disabled={selected.size === 0}
            className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[16px] font-semibold text-black transition-[transform,background-color,opacity] hover:bg-accent-2 active:scale-[0.98] disabled:opacity-40"
          >
            {selected.size === 0
              ? "Select exercises to add"
              : `Add ${selected.size} exercise${selected.size === 1 ? "" : "s"}`}
          </button>
        </div>
      ) : null}

      {previewFor ? (
        <VideoModal
          exercise={previewFor}
          onClose={() => setPreviewFor(null)}
          actionLabel={
            multiple
              ? selected.has(previewFor.id)
                ? "Remove from selection"
                : "Add to workout"
              : swapping
                ? "Swap to this exercise"
                : "Add exercise"
          }
          onAction={() => {
            if (multiple) {
              toggle(previewFor.id);
              setPreviewFor(null);
            } else {
              onPick(previewFor);
              setPreviewFor(null);
              onClose();
            }
          }}
        />
      ) : null}
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
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 13l4 4L19 7" />
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
          aria-pressed={value === opt}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
            value === opt ? "bg-fg text-bg" : "bg-surface-2 text-muted hover:text-fg"
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
