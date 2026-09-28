"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveChallengeSetup } from "@/app/(app)/dashboard/actions";
import { subscribeToPush, isIOS, isAndroid, isStandalone } from "@/lib/pushClient";
import ImageModal from "@/components/onboarding/ImageModal";

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
  const [step, setStep] = useState(0); // 0 welcome, 1 equipment, 2 reminders, 3 home screen, 4 done
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const [needsHomeScreen, setNeedsHomeScreen] = useState(false);
  const [showAndroidHint, setShowAndroidHint] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);

  useEffect(() => {
    function check() {
      const standalone = isStandalone();
      setNeedsHomeScreen(isIOS() && !standalone);
      setShowAndroidHint(isAndroid() && !standalone);
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

  // Skips the home screen step entirely for anyone it doesn't apply to
  // (already standalone, or a platform with no screenshot for it).
  function advanceFromReminders() {
    setStep(needsHomeScreen || showAndroidHint ? 3 : 4);
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
    advanceFromReminders();
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

        {step < 4 ? (
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-gradient-to-r from-accent to-accent-2" : "bg-border"
                }`}
              />
            ))}
          </div>
        ) : null}

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
              <p className="text-sm text-muted">
                iPhone only turns these on for apps added to your Home Screen. The next step shows you
                exactly how.
              </p>
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
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-dim hover:text-fg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={advanceFromReminders}
                className="text-xs font-medium text-dim hover:text-fg"
              >
                {needsHomeScreen ? "Continue" : "Not now"}
              </button>
            </div>
          </>
        ) : step === 3 ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-dim">
                {needsHomeScreen ? "One more thing" : "Optional"}
              </span>
              <h2 className="font-display text-xl font-semibold text-fg">Add SKILL to your Home Screen</h2>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                <IconShare className="h-4 w-4" />
              </span>
              <p className="text-sm text-muted">
                {needsHomeScreen
                  ? "iPhone only allows reminders for apps added to your Home Screen. Tap the Share button in Safari, then “Add to Home Screen”. Open SKILL from there and turn reminders on in Settings."
                  : "Not required, but it opens like a real app instead of a browser tab. In Chrome’s menu, tap “Install and create shortcut”."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScreenshot(true)}
              className="inline-flex w-fit items-center gap-1.5 self-start rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-black"
            >
              <IconImage className="h-3.5 w-3.5" />
              See screenshot
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs font-medium text-dim hover:text-fg"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-xs font-medium text-dim hover:text-fg"
              >
                Continue
              </button>
            </div>

            {showScreenshot ? (
              <ImageModal
                src={needsHomeScreen ? "/onboarding/add-to-home-ios.jpg" : "/onboarding/add-to-home-android.jpg"}
                alt={
                  needsHomeScreen
                    ? "Safari share sheet with Add to Home Screen highlighted"
                    : "Chrome menu with Install and create shortcut highlighted"
                }
                onClose={() => setShowScreenshot(false)}
              />
            ) : null}
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

function IconShare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v12" />
      <path d="m8 7 4-4 4 4" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  );
}

function IconImage(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5L5 20" />
    </svg>
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
