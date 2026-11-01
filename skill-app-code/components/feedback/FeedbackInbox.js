"use client";

import { useState } from "react";
import FeedbackThreads from "@/components/feedback/FeedbackThreads";

const FILTERS = [
  ["todo", "To do"],
  ["done", "Done"],
  ["all", "All"],
];

// The coach's inbox with a To do / Done / All switch.
export default function FeedbackInbox({ threads }) {
  const [filter, setFilter] = useState("todo");
  const shown = threads.filter((t) =>
    filter === "all" ? true : filter === "done" ? t.status === "done" : t.status !== "done",
  );
  return (
    <div className="flex flex-col gap-4">
      <div role="radiogroup" aria-label="Show" className="flex rounded-[10px] bg-surface-2 p-0.5">
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={filter === key}
            onClick={() => setFilter(key)}
            className={`flex-1 rounded-[8px] py-1.5 text-[13px] font-semibold transition-colors ${
              filter === key ? "bg-fg text-bg shadow-sm" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {shown.length ? (
        <FeedbackThreads threads={shown} viewer="coach" />
      ) : (
        <p className="rounded-2xl bg-surface p-8 text-center text-[15px] text-muted">
          {filter === "todo" ? "Nothing waiting. All caught up." : "Nothing here yet."}
        </p>
      )}
    </div>
  );
}
