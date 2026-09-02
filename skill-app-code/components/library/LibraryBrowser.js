"use client";

import { useMemo, useState } from "react";
import { loomEmbedUrl } from "@/lib/exercises";

export default function LibraryBrowser({ groups }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState(null);

  const categories = ["All", ...groups.map((g) => g.category)];
  const total = useMemo(
    () => groups.reduce((n, g) => n + g.exercises.length, 0),
    [groups],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((g) => category === "All" || g.category === category)
      .map((g) => ({
        ...g,
        exercises: q
          ? g.exercises.filter((e) => e.name.toLowerCase().includes(q))
          : g.exercises,
      }))
      .filter((g) => g.exercises.length > 0);
  }, [groups, query, category]);

  const shown = filtered.reduce((n, g) => n + g.exercises.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${total} exercises`}
          className="w-full rounded-field border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                category === c
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-muted hover:text-fg"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {shown === 0 ? (
        <p className="py-10 text-center text-sm text-muted">
          No exercises match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map((group) => (
            <section key={group.category} className="flex flex-col gap-2">
              <h2 className="flex items-baseline gap-2 text-xs font-semibold uppercase tracking-wider text-dim">
                {group.category}
                <span className="text-dim/70">{group.exercises.length}</span>
              </h2>
              <ul className="overflow-hidden rounded-card border border-border">
                {group.exercises.map((exercise, i) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    first={i === 0}
                    open={openId === exercise.id}
                    onToggle={() =>
                      setOpenId(openId === exercise.id ? null : exercise.id)
                    }
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ exercise, first, open, onToggle }) {
  const embedUrl = loomEmbedUrl(exercise.video_url);

  return (
    <li className={first ? "" : "border-t border-border"}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="flex-1 text-sm font-medium text-fg">
          {exercise.name}
        </span>
        {embedUrl ? (
          <IconPlay className="h-4 w-4 shrink-0 text-dim" />
        ) : (
          <span className="shrink-0 text-[11px] text-dim">no video</span>
        )}
        <IconChevron
          className={`h-4 w-4 shrink-0 text-dim transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-border bg-surface px-4 py-3">
          <p className="text-sm text-muted">
            {exercise.cue || "No coaching cue yet."}
          </p>
          {embedUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-field border border-border bg-black">
              <iframe
                src={embedUrl}
                title={`${exercise.name} form video`}
                allowFullScreen
                loading="lazy"
                className="h-full w-full"
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
