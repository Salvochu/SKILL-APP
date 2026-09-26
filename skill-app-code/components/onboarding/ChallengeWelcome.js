"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveChallengeSetup } from "@/app/(app)/dashboard/actions";
import { subscribeToPush, isIOS, isStandalone } from "@/lib/pushClient";

// First-run flow for a free challenge sign-up. Short: welcome + how it
// works, one equipment question, a reminders prompt, then straight to
// Day 1. Same modal shape as OnboardingQuiz. The reminders step matters
// more here than anywhere else in the app: the streak-nudge cron
// (app/api/push/reminders/route.js) can only reach someone who has
// actually subscribed, and a 14-day challenge has no time to catch that
// later in Settings.
export default function ChallengeWelcome({ show = false, initialName = "" }) {
  const router = useRouter();
  const [latched] = useState(show);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0); // 0 welcome, 1 equipment, 2 reminders, 3 done
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [needsHomeScreen, setNeedsHomeScreen] = useState(false);

  useEffect(() => {
    async function check() {
      setNeedsHomeScreen(isIOS() && !isStandalone());
    }
    check();
  }, []);

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

  async function enableReminders() {
    setNotifBusy(true);
    setNotifError(null);
    const res = await subscribeToPush();
    setNotifBusy(false);
    if (!res.ok) {
      setNotifError(
        res.error === "unsupported"
          ? "Notifications aren't supported on this browser."
          : res.error === "denied"
            ? "Notifications are blocked. You can turn them on later in Settings."
            : "Could not turn on notifications. You can try again later in Settings.",
      );
      return;
    }
    setStep(3);
  }

  function leave() {
    setDismissed(true);
    router.push("/challenge");
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
        ) : step === 2 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">One more thing</span>
              <h2 className="font-display text-xl font-semibold text-fg">Get reminders</h2>
              <p className="text-sm text-muted">
                A nudge if your streak is about to break, so 14 days do not slip by without
                you noticing. Off anytime in Settings.
              </p>
            </div>

            {needsHomeScreen ? (
              <div className="flex flex-col gap-1.5 rounded-field border border-border bg-bg px-4 py-3.5">
                <p className="text-sm font-medium text-fg">Add SKILL to your Home Screen first</p>
                <p className="text-xs text-muted">
                  iPhone only allows reminders for apps added to your Home Screen. Tap the Share
                  button in Safari, then &quot;Add to Home Screen&quot;. Open SKILL from there and
                  turn reminders on in Settings.
                </p>
              </div>
            ) : (
              <>
                {notifError ? <p className="text-sm text-danger">{notifError}</p> : null}
                <button
                  type="button"
                  onClick={enableReminders}
                  disabled={notifBusy}
                  className="w-full rounded-field bg-accent px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
                >
                  {notifBusy ? "..." : "Turn on reminders"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setStep(3)}
              className="self-center text-xs font-medium text-dim hover:text-fg"
            >
              {needsHomeScreen ? "Continue" : "Not now"}
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
