"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startMesocycle, loadMesocycleOverview } from "@/app/(app)/dashboard/actions";
import ProgramOverview from "@/components/ProgramOverview";

// An opt-in prompt on a split's own page: browsing it stays exactly as
// free-form as before, this is a deliberate extra step for anyone who
// decides they want the guided, week-by-week version of this same split.
export default function StartProgramCard({ template }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  async function onOpen() {
    setOpen(true);
    if (overview) return;
    setLoading(true);
    setError(null);
    const detail = await loadMesocycleOverview(template.id);
    setLoading(false);
    if (!detail) {
      setError("Could not load that program.");
      return;
    }
    setOverview(detail);
    setVariant(detail.variants[0] ?? "Standard");
  }

  async function onStart() {
    setStarting(true);
    setError(null);
    const result = await startMesocycle(template.id, variant);
    setStarting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-accent/40 bg-accent-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-fg">Want a guided program instead?</h2>
          <p className="text-sm text-muted">
            Run this split as a {template.weeks} week program: effort builds week by week, then a
            deload.
          </p>
        </div>
        {open ? (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 text-xs font-medium text-dim hover:text-fg"
          >
            Close
          </button>
        ) : null}
      </div>

      {!open ? (
        <button
          type="button"
          onClick={onOpen}
          className="self-start rounded-field border border-accent/40 bg-surface px-3 py-1.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
        >
          Run as a program
        </button>
      ) : loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : overview ? (
        <ProgramOverview
          overview={overview}
          variant={variant}
          onVariantChange={setVariant}
          onStart={onStart}
          starting={starting}
          error={error}
        />
      ) : error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}
    </section>
  );
}
