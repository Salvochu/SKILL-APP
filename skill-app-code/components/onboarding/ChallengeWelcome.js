"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveChallengeSetup } from "@/app/(app)/dashboard/actions";
import { completeOnboarding } from "@/app/(app)/profile/actions";

// First-run flow for a free challenge sign-up. Short: welcome + how it
// works, one equipment question, then straight to Day 1. Same modal
// shape as OnboardingQuiz.
export default function ChallengeWelcome({ show = false, initialName = "" }) {
  const router = useRouter();
  const [latched] = useState(show);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0); // 0 welcome, 1 equipment, 2 done
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (dismissed || (!latched && !show)) return null;

  const firstName = (name || initialName).trim().split(/\s+/)[0] || "";

  async function pickEquipment(equipment) {
    setSaving(true);
    setError(null);
    const res = await saveChallengeSetup({ equipment, name });
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setStep(2);
  }

  function leave() {
    setDismissed(true);
    router.push("/challenge");
    router.refresh();
  }
  async function skip() {
    setDismissed(true);
    await completeOnboarding();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to the challenge"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-6">

        {step === 0 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                14-Day Main Character
              </span>
              <h2 className="font-display text-xl font-semibold text-fg">
                You&apos;re in{firstName ? `, ${firstName}` : ""}
              </h2>
            </div>

            <ul className="flex flex-col gap-3">
              <HowItWorks n="1">
                Three full-body sessions plus one cardio each week, alternating Day A and Day B. That is
                8 sessions across your 14 days: 6 lifts and 2 cardio.
              </HowItWorks>
              <HowItWorks n="2">
                Your Challenge tab has a plan for every one of the 14 days, a short video for each, and
                a daily checklist to keep you honest.
              </HowItWorks>
              <HowItWorks n="3">
                Log every set here. The app shows you exactly what to beat each session. Your meal plan
                is in the PDFs from your welcome email.
              </HowItWorks>
            </ul>

            {!initialName ? (
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
                What should we call you?
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  placeholder="Your name"
                  className="w-full rounded-field border border-border bg-bg px-3 py-2.5 text-sm text-fg focus:border-accent"
                />
              </label>
            ) : null}

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full rounded-field bg-accent px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-accent-2"
            >
              Set me up
            </button>
            <button
              type="button"
              onClick={skip}
              className="self-center text-xs font-medium text-dim hover:text-fg"
            >
              I&apos;ll look around first
            </button>
          </>
        ) : step === 1 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">One question</span>
              <h2 className="font-display text-xl font-semibold text-fg">Where are you training?</h2>
              <p className="text-sm text-muted">
                This picks which version of each workout you get. You can change it any time.
              </p>
            </div>

            {error ? <p className="text-sm text-danger">{error}</p> : null}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={saving}
                onClick={() => pickEquipment("Full Gym")}
                className="flex flex-col gap-0.5 rounded-field border border-border px-4 py-3.5 text-left transition-colors hover:border-accent hover:bg-accent-soft disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-fg">Full gym</span>
                <span className="text-xs text-dim">Barbells, machines, the lot</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => pickEquipment("Dumbbells")}
                className="flex flex-col gap-0.5 rounded-field border border-border px-4 py-3.5 text-left transition-colors hover:border-accent hover:bg-accent-soft disabled:opacity-60"
              >
                <span className="text-sm font-semibold text-fg">At home</span>
                <span className="text-xs text-dim">A pair of dumbbells is all you need</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(0)}
              className="self-center text-xs font-medium text-dim hover:text-fg"
            >
              Back
            </button>
          </>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <h2 className="font-display text-xl font-semibold text-fg">
              You&apos;re set{firstName ? `, ${firstName}` : ""}
            </h2>
            <p className="text-sm text-muted">
              Next: watch the welcome video, take your day 1 photos and do your food shop.
              Your 14 days begin when you tap <span className="font-semibold text-fg">Start my 14 days</span>,
              so start on a day you can train.
            </p>
            <button
              type="button"
              onClick={leave}
              className="w-full rounded-field bg-accent px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-accent-2"
            >
              Get set up and start
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function HowItWorks({ n, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">
        {n}
      </span>
      <span className="text-sm text-fg">{children}</span>
    </li>
  );
}
