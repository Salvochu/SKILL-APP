"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import LoggedAt from "@/components/LoggedAt";
import { setMyWorkoutGroup } from "@/app/(app)/workouts/my-actions";

const NEW_GROUP = "__new__";

// The user's own saved workouts. Each card starts collapsed (name + last
// logged date only); tapping the chevron reveals the muscle summary and
// a control to file it under a group. Tapping the card body itself starts
// a session from it (GuardedStartLink warns first if another workout is
// unsaved); the pencil opens the builder to edit it. Always shows the
// "Build a workout" entry point, even with an empty list.
export default function MyWorkoutsSection({ myWorkouts }) {
  const groups = useMemo(() => groupWorkouts(myWorkouts), [myWorkouts]);
  const groupNames = useMemo(
    () => [...new Set(myWorkouts.map((w) => w.groupName).filter(Boolean))].sort(),
    [myWorkouts],
  );

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">My workouts</h2>
        <TapLink
          href="/workouts/mine/new"
          className="flex items-center gap-1 rounded-field px-1 text-xs font-semibold text-accent transition-colors hover:text-accent-2"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Build a workout
        </TapLink>
      </div>

      {myWorkouts.length === 0 ? (
        <TapLink
          href="/workouts/mine/new"
          className="flex flex-col items-center gap-1 rounded-card border border-dashed border-border p-6 text-center transition-colors hover:border-border-strong hover:bg-surface-2"
        >
          <span className="text-sm font-medium text-fg">Build your own workout</span>
          <span className="text-xs text-dim">Save a set of exercises you can start any day</span>
        </TapLink>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(({ name, items }) => (
            <div key={name ?? "__ungrouped"} className="flex flex-col gap-2.5">
              {/* A single "null" bucket means nobody has grouped anything -
                  show a plain flat list. Any real group name gets a
                  heading, even if every workout ended up in just the one. */}
              {groupNames.length > 0 ? (
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-dim">
                  {name ?? "Ungrouped"}
                </h3>
              ) : null}
              <ul className="flex flex-col gap-2.5">
                {items.map((w) => (
                  <WorkoutCard key={w.id} workout={w} groupNames={groupNames} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function groupWorkouts(myWorkouts) {
  const hasAnyGroup = myWorkouts.some((w) => w.groupName);
  if (!hasAnyGroup) return [{ name: null, items: myWorkouts }];

  const map = new Map();
  for (const w of myWorkouts) {
    const key = w.groupName || null;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(w);
  }
  // Named groups alphabetically first, "Ungrouped" last.
  const named = [...map.keys()].filter((k) => k !== null).sort();
  const ordered = map.has(null) ? [...named, null] : named;
  return ordered.map((name) => ({ name, items: map.get(name) }));
}

function WorkoutCard({ workout: w, groupNames }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li className="flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border-strong">
      <div className="flex items-stretch">
        <GuardedStartLink
          href={`/log?mine=${w.id}`}
          className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-4 text-left transition-colors hover:bg-surface-2"
        >
          <span className="block truncate font-display text-base font-semibold text-fg">{w.name}</span>
          <span className="block truncate text-xs text-dim">
            {w.lastLoggedAt ? (
              <>
                Last logged <LoggedAt iso={w.lastLoggedAt} />
              </>
            ) : (
              "Not logged yet"
            )}
          </span>
        </GuardedStartLink>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Show less" : "Show more"}
          className="flex shrink-0 items-center px-3 text-dim transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <IconChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        <TapLink
          href={`/workouts/mine/${w.id}`}
          aria-label={`Edit ${w.name}`}
          className="flex shrink-0 items-center px-3 text-dim transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <IconPencil className="h-4 w-4" />
        </TapLink>
      </div>

      {expanded ? (
        <div className="flex flex-col gap-3 border-t border-border bg-bg/30 p-4">
          <p className="text-xs text-dim">
            {w.muscleSummary || `${w.exercises.length} exercise${w.exercises.length === 1 ? "" : "s"}`}
          </p>
          <GroupPicker workoutId={w.id} current={w.groupName} groupNames={groupNames} />
        </div>
      ) : null}
    </li>
  );
}

function GroupPicker({ workoutId, current, groupNames }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function apply(groupName) {
    setSaving(true);
    await setMyWorkoutGroup(workoutId, groupName);
    router.refresh();
    setSaving(false);
  }

  function onSelect(e) {
    const value = e.target.value;
    if (value === NEW_GROUP) {
      setAdding(true);
      return;
    }
    apply(value === "" ? null : value);
  }

  async function submitNewGroup(e) {
    e.preventDefault();
    const name = draft.trim();
    if (!name) {
      setAdding(false);
      return;
    }
    await apply(name);
    setAdding(false);
    setDraft("");
  }

  if (adding) {
    return (
      <form onSubmit={submitNewGroup} className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => !draft.trim() && setAdding(false)}
          placeholder="New group name"
          maxLength={40}
          className="min-w-0 flex-1 rounded-field border border-border bg-bg/40 px-2.5 py-1.5 text-sm text-fg placeholder:text-dim"
        />
        <button
          type="submit"
          className="shrink-0 rounded-field bg-accent px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Add
        </button>
      </form>
    );
  }

  return (
    <label className="flex items-center gap-2 text-xs text-dim">
      Group
      <select
        value={current ?? ""}
        onChange={onSelect}
        disabled={saving}
        className="min-w-0 flex-1 rounded-field border border-border bg-bg/40 px-2.5 py-1.5 text-sm text-fg disabled:opacity-60"
      >
        <option value="">Ungrouped</option>
        {groupNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        <option value={NEW_GROUP}>+ New group&hellip;</option>
      </select>
    </label>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconPencil(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function IconChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
