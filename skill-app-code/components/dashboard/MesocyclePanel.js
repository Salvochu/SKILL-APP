"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { abandonMesocycle } from "@/app/(app)/dashboard/actions";
import TapLink from "@/components/TapLink";
import GuardedStartLink from "@/components/log/GuardedStartLink";
import ProgressBar from "@/components/ProgressBar";
import MesocycleComplete from "@/components/dashboard/MesocycleComplete";

export default function MesocyclePanel({ active, summary }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [menuOpen]);

  async function onAbandon() {
    setBusy(true);
    setError(null);
    setMenuOpen(false);
    const result = await abandonMesocycle(active.id);
    setBusy(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  // No program running: a slim prompt, nothing more. The full picker
  // lives on the Splits page.
  if (!active) {
    return (
      <TapLink
        href="/splits"
        className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <IconFlag className="h-[18px] w-[18px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-fg">Run a guided program</span>
          <span className="truncate text-xs text-dim">Turn a split into a week-by-week block</span>
        </span>
        <IconChevron className="h-3.5 w-3.5 shrink-0 text-dim" />
      </TapLink>
    );
  }

  if (active.isComplete) {
    return <MesocycleComplete active={active} summary={summary} />;
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-accent/30 bg-accent-soft p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Week {active.week} of {active.weeks}
            {active.isDeload ? " . Deload" : ""}
          </span>
          <h2 className="font-display text-lg font-semibold text-fg">{active.splitName}</h2>
        </div>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Program options"
            aria-expanded={menuOpen}
            className="rounded-field p-1.5 text-muted transition-colors hover:bg-accent/10 hover:text-fg"
          >
            <IconDots className="h-5 w-5" />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-full z-10 mt-1 flex w-40 flex-col overflow-hidden rounded-card border border-border bg-surface shadow-lg">
              <TapLink
                href="/splits"
                className="px-3 py-2.5 text-left text-sm text-fg transition-colors hover:bg-surface-2"
              >
                Switch program
              </TapLink>
              <button
                type="button"
                onClick={onAbandon}
                disabled={busy}
                className="px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:opacity-60"
              >
                Stop program
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {active.guidance ? (
        <div className="rounded-field border border-accent/30 bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {active.guidance.headline}
          </p>
          <p className="mt-1 text-sm text-fg">{active.guidance.detail}</p>
        </div>
      ) : null}

      {active.sessionsPerWeek > 0 ? (
        <div className="flex flex-col gap-2 rounded-field border border-border bg-surface p-3">
          <ProgressBar
            label="This week"
            value={Math.min(active.sessionsThisWeek, active.sessionsPerWeek)}
            max={active.sessionsPerWeek}
            tone="danger"
          />
          <ProgressBar
            label="Whole program"
            value={Math.min(active.sessionsLogged, active.weeks * active.sessionsPerWeek)}
            max={active.weeks * active.sessionsPerWeek}
            tone="good"
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {active.nextDay ? (
        <GuardedStartLink
          href={`/log?meso=${active.id}&split=${active.splitId}&day=${active.nextDay.dayTemplateId}&variant=${encodeURIComponent(active.variant)}`}
          className="flex w-full items-center justify-center rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2"
        >
          Start {active.nextDay.name}
        </GuardedStartLink>
      ) : (
        <p className="text-sm text-muted">This program&apos;s split has no days set up yet.</p>
      )}
    </section>
  );
}

function IconDots(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  );
}
function IconFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4 3 4H5" />
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
