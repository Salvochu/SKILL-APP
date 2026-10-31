"use client";

import { useMemo, useState } from "react";
import { MUSCLE_ORDER, sortEquipment, muscleKey, musclesInGroup } from "@/lib/exercises";
import ExerciseSheet from "@/components/library/ExerciseSheet";
import MusclePill from "@/components/MusclePill";

// Every muscle an exercise touches, primary tags first. Falls back to the
// parent group when a row has no tags yet.
function tagsFor(e) {
  if (e.muscles && e.muscles.length) return e.muscles;
  return e.muscle ? [{ id: e.muscle, name: e.muscle, parent: e.muscle, role: "primary" }] : [];
}

export default function LibraryBrowser({ exercises, noun = "exercise", canLog = true }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [sub, setSub] = useState("All");
  const [equipment, setEquipment] = useState("All");
  const [openId, setOpenId] = useState(null);

  const plural = /(s|sh|ch|x|z)$/.test(noun) ? `${noun}es` : `${noun}s`;

  const groups = useMemo(() => {
    const present = new Set(exercises.flatMap((e) => tagsFor(e).map((m) => m.parent)));
    return MUSCLE_ORDER.filter((g) => present.has(g));
  }, [exercises]);

  const subs = useMemo(() => {
    if (group === "All") return [];
    const present = new Set(
      exercises.flatMap((e) => tagsFor(e).filter((m) => m.parent === group).map((m) => m.name)),
    );
    return musclesInGroup(group).map((m) => m.name).filter((n) => present.has(n));
  }, [exercises, group]);

  const equipmentList = useMemo(
    () => sortEquipment([...new Set(exercises.map((e) => e.equipment).filter(Boolean))]),
    [exercises],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      const tags = tagsFor(e);
      if (group !== "All" && !tags.some((m) => m.parent === group)) return false;
      if (sub !== "All" && !tags.some((m) => m.name === sub)) return false;
      if (equipment !== "All" && e.equipment !== equipment) return false;
      if (q && !(`${e.name} ${e.instructions ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [exercises, query, group, sub, equipment]);

  const open = exercises.find((e) => e.id === openId) ?? null;

  function pickGroup(g) {
    setGroup(g);
    setSub("All");
  }

  return (
    <div className="flex flex-col gap-3.5">
      <label className="relative flex items-center">
        <IconSearch className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-dim" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${plural} or instructions`}
          aria-label={`Search ${plural}`}
          className="w-full rounded-xl bg-fg/[0.07] py-2.5 pl-10 pr-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60"
        />
      </label>

      <ChipRow value={group} onChange={pickGroup} options={groups} allLabel="All muscles" dots />
      {subs.length > 0 ? (
        <ChipRow value={sub} onChange={setSub} options={subs} allLabel={`All ${group.toLowerCase()}`} />
      ) : null}
      {equipmentList.length > 0 ? (
        <ChipRow value={equipment} onChange={setEquipment} options={equipmentList} allLabel="All equipment" />
      ) : null}

      <p className="px-1 pt-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
        {filtered.length} {filtered.length === 1 ? noun : plural}
      </p>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-surface py-10 text-center text-[15px] text-muted">No {plural} match those filters.</p>
      ) : (
        <ul className="-mt-1 overflow-hidden rounded-2xl bg-surface [&>li:first-child_.row-sep]:border-transparent">
          {filtered.map((e) => {
            const primary = tagsFor(e).filter((m) => m.role === "primary").slice(0, 3);
            const pills = primary.length ? primary.slice(0, 2).map((m) => m.name) : e.muscle ? [e.muscle] : [];
            const meta = pills.length || e.equipment;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(e.id)}
                  className="flex w-full pl-4 text-left transition-colors hover:bg-surface-2 active:bg-surface-2"
                >
                  <span className="row-sep flex min-w-0 flex-1 items-center gap-3 border-t border-border/70 py-3 pr-4">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="line-clamp-2 text-[16px] font-semibold leading-snug text-fg">{e.name}</span>
                      {meta ? (
                        <span className="mt-1 flex min-w-0 items-center gap-1.5">
                          {pills.map((m) => (
                            <MusclePill key={m} muscle={m} />
                          ))}
                          {e.equipment ? <span className="ml-0.5 truncate text-[13px] text-dim">{e.equipment}</span> : null}
                        </span>
                      ) : null}
                      {e.instructions ? (
                        <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted">{e.instructions}</span>
                      ) : null}
                    </span>
                    {e.video_url ? (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <IconPlay className="ml-0.5 h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <IconChevron className="h-4 w-4 shrink-0 text-dim" />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open ? <ExerciseSheet exercise={open} onClose={() => setOpenId(null)} canLog={canLog} /> : null}
    </div>
  );
}

function ChipRow({ value, onChange, options, allLabel, dots }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
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

function IconPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
function IconChevron(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </svg>
  );
}
