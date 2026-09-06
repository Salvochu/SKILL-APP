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
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Search ${plural} or instructions`}
        className="w-full rounded-field border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-dim focus:border-accent"
      />

      <ChipRow value={group} onChange={pickGroup} options={groups} allLabel="All muscles" dots />
      {subs.length > 0 ? (
        <ChipRow value={sub} onChange={setSub} options={subs} allLabel={`All ${group.toLowerCase()}`} />
      ) : null}
      {equipmentList.length > 0 ? (
        <ChipRow value={equipment} onChange={setEquipment} options={equipmentList} allLabel="All equipment" />
      ) : null}

      <p className="text-xs text-dim">
        {filtered.length} {filtered.length === 1 ? noun : plural}
      </p>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">No {plural} match those filters.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((e) => {
            const primary = tagsFor(e).filter((m) => m.role === "primary").slice(0, 3);
            return (
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
                    {primary.map((m) => (
                      <MusclePill key={m.id} muscle={m.name} />
                    ))}
                    {e.equipment ? (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted">
                        {e.equipment}
                      </span>
                    ) : null}
                  </span>
                  {e.instructions ? (
                    <span className="line-clamp-2 text-sm text-muted">{e.instructions}</span>
                  ) : null}
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
