"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logBodyEntry } from "@/app/(app)/body/actions";
import { toKg, fromKg, unitLabel } from "@/lib/units";
import { Group, Row, rowInput } from "@/components/ui/Grouped";

const MEASURES = [
  { name: "waist", label: "Waist" },
  { name: "chest", label: "Chest" },
  { name: "arm", label: "Arm" },
  { name: "thigh", label: "Thigh" },
  { name: "hip", label: "Hip" },
];

export default function BodyLogForm({ latest, unit = "kg" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showMeasures, setShowMeasures] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    // Weight is entered in the user's unit; store kg.
    const typed = fd.get("weight");
    if (typed !== null && String(typed).trim() !== "") {
      fd.set("weight", String(Math.round(toKg(typed, unit) * 100) / 100));
    }
    const result = await logBodyEntry(fd);
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    setSaving(false);
    setOpen(false);
    setShowMeasures(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(252,118,5,0.75)] transition-transform active:scale-[0.98]"
      >
        <IconPlus className="h-[18px] w-[18px]" />
        Log a check-in
      </button>
    );
  }

  const numberInput = `tabular-nums ${rowInput}`;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="font-sans text-[20px] font-bold tracking-[-0.015em] text-fg">New check-in</h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setShowMeasures(false);
          }}
          className="rounded-lg px-1 py-1 text-[16px] font-medium text-accent transition-opacity active:opacity-60"
        >
          Cancel
        </button>
      </div>

      <Group>
        <Row label="Date" htmlFor="bl-date">
          {/* Hugs its value at the right of the row like the other
              fields (a stretched date control left-aligns its text). */}
          <input
            id="bl-date"
            type="date"
            name="date"
            defaultValue={today}
            max={today}
            className={`${rowInput} !w-auto appearance-none [&::-webkit-date-and-time-value]:text-right`}
          />
        </Row>
        <Row label={`Weight (${unitLabel(unit)})`} htmlFor="bl-weight">
          <input
            id="bl-weight"
            type="number"
            name="weight"
            inputMode="decimal"
            step="0.1"
            placeholder={
              latest?.weight != null
                ? String(Math.round(fromKg(latest.weight, unit) * 10) / 10)
                : "0.0"
            }
            className={numberInput}
          />
        </Row>
        <Row label="Body fat (%)" htmlFor="bl-fat">
          <input
            id="bl-fat"
            type="number"
            name="bodyFat"
            inputMode="decimal"
            step="0.1"
            placeholder={latest?.fat != null ? String(latest.fat) : "0.0"}
            className={numberInput}
          />
        </Row>
      </Group>

      {showMeasures ? (
        <Group
          title="Measurements (cm)"
          footer={
            <button
              type="button"
              onClick={() => setShowMeasures(false)}
              className="font-medium text-accent transition-opacity active:opacity-60"
            >
              Hide measurements
            </button>
          }
        >
          {MEASURES.map((m) => (
            <Row key={m.name} label={m.label} htmlFor={`bl-${m.name}`}>
              <input
                id={`bl-${m.name}`}
                type="number"
                name={m.name}
                inputMode="decimal"
                step="0.1"
                placeholder={latest?.[m.name] != null ? String(latest[m.name]) : "0.0"}
                className={numberInput}
              />
            </Row>
          ))}
        </Group>
      ) : (
        <button
          type="button"
          onClick={() => setShowMeasures(true)}
          className="flex items-center gap-1.5 self-start rounded-lg px-1 py-1 text-[16px] font-medium text-accent transition-opacity active:opacity-60"
        >
          <IconPlus className="h-4 w-4" />
          Add measurements
        </button>
      )}

      <Group>
        <div className="px-4">
          <input
            type="text"
            name="note"
            aria-label="Note"
            placeholder="Note (optional): how you are feeling, context"
            className="w-full bg-transparent py-3.5 text-[16px] text-fg outline-none placeholder:text-dim"
          />
        </div>
      </Group>

      {error ? <p className="px-1 text-[14px] text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-4 text-[17px] font-semibold text-black transition-[transform,opacity] active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save check-in"}
      </button>
    </form>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
