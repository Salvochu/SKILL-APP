"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logBodyEntry } from "@/app/(app)/body/actions";
import { toKg, fromKg, unitLabel } from "@/lib/units";

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
        className="rounded-field bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2"
      >
        Log a check-in
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-fg">New check-in</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-dim hover:text-fg">
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" name="date" defaultValue={today} max={today} className={inputClass} />
        </Field>
        <Field label={`Weight (${unitLabel(unit)})`}>
          <input
            type="number"
            name="weight"
            inputMode="decimal"
            step="0.1"
            placeholder={
              latest?.weight != null
                ? String(Math.round(fromKg(latest.weight, unit) * 10) / 10)
                : "0.0"
            }
            className={inputClass}
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={() => setShowMeasures((v) => !v)}
        className="self-start text-xs font-medium text-accent hover:underline"
      >
        {showMeasures ? "Hide measurements" : "Add measurements"}
      </button>

      {showMeasures ? (
        <div className="grid grid-cols-2 gap-3">
          {MEASURES.map((m) => (
            <Field key={m.name} label={`${m.label} (cm)`}>
              <input
                type="number"
                name={m.name}
                inputMode="decimal"
                step="0.1"
                placeholder={latest?.[m.name] != null ? String(latest[m.name]) : "0.0"}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
      ) : null}

      <Field label="Note (optional)">
        <input type="text" name="note" placeholder="How you are feeling, context" className={inputClass} />
      </Field>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-field bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save check-in"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent";

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-dim">{label}</span>
      {children}
    </label>
  );
}
