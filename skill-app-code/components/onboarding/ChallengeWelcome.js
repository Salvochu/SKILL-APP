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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="glass-strong relative flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-[28px] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-3xl sm:pb-6">

        {step < 4 ? (
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-fg/15"}`}
              />
            ))}
          </div>
        ) : null}

        {step === 0 ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
                14-Day Main Character
              </span>
              <h2 className="text-balance font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                You&apos;re in{firstName ? `, ${firstName}` : ""}
              </h2>
            </div>

            <ol className="flex flex-col overflow-hidden rounded-2xl bg-fg/5 [&>li+li]:border-t [&>li+li]:border-fg/10">
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
            </ol>

            {!initialName ? (
              <label className="flex flex-col gap-2 text-[15px] font-medium text-muted">
                What should we call you?
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  placeholder="Your name"
                  className={FIELD}
                />
              </label>
            ) : null}

            <button type="button" onClick={() => setStep(1)} className={PRIMARY}>
              Set me up
            </button>
          </>
        ) : step === 1 ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">One question</span>
              <h2 className="text-balance font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                Where are you training?
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                This picks which version of each workout you get. You can change it any time.
              </p>
            </div>

            {error ? <p className="text-[14px] text-danger">{error}</p> : null}

            <div className="flex flex-col gap-2">
              <EquipmentOption
                disabled={saving}
                onClick={() => pickEquipment("Full Gym")}
                title="Full gym"
                body="Barbells, machines, the lot"
              />
              <EquipmentOption
                disabled={saving}
                onClick={() => pickEquipment("Dumbbells")}
                title="At home"
                body="A pair of dumbbells is all you need"
              />
            </div>

            <button type="button" onClick={() => setStep(0)} className={TEXT_BUTTON}>
              Back
            </button>
          </>
        ) : step === 2 ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black">
              <IconBell className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">One more thing</span>
              <h2 className="text-balance font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                Get reminders
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                A nudge if your streak is about to break, so 14 days do not slip by without
                you noticing. Off anytime in Settings.
              </p>
            </div>

            {needsHomeScreen ? (
              <p className="rounded-2xl bg-fg/5 px-4 py-3 text-[15px] leading-relaxed text-muted">
                iPhone only turns these on for apps added to your Home Screen. The next step shows you
                exactly how.
              </p>
            ) : (
              <>
                {notifError ? <p className="text-[14px] text-danger">{notifError}</p> : null}
                <button type="button" onClick={enableReminders} disabled={notifBusy} className={`${PRIMARY} disabled:opacity-60`}>
                  {notifBusy ? "..." : "Turn on reminders"}
                </button>
              </>
            )}
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className={TEXT_BUTTON}>
                Back
              </button>
              <button type="button" onClick={advanceFromReminders} className={TEXT_BUTTON}>
                {needsHomeScreen ? "Continue" : "Not now"}
              </button>
            </div>
          </>
        ) : step === 3 ? (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black">
              <IconShare className="h-6 w-6" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
                {needsHomeScreen ? "One more thing" : "Optional"}
              </span>
              <h2 className="text-balance font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                Add SKILL to your Home Screen
              </h2>
              <p className="mt-1 text-[15px] leading-relaxed text-muted">
                {needsHomeScreen
                  ? "iPhone only allows reminders for apps added to your Home Screen. Tap the Share button in Safari, then “Add to Home Screen”. Open SKILL from there and turn reminders on in Settings."
                  : "Not required, but it opens like a real app instead of a browser tab. In Chrome’s menu, tap “Install and create shortcut”."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScreenshot(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-fg/10 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98]"
            >
              <IconImage className="h-4 w-4" />
              Show me a screenshot
            </button>

            <button type="button" onClick={() => setStep(4)} className={PRIMARY}>
              Continue
            </button>
            <button type="button" onClick={() => setStep(2)} className={TEXT_BUTTON}>
              Back
            </button>

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
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-[0_0_30px_-6px_rgba(252,118,5,0.8)]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-balance font-display text-[1.75rem] font-bold leading-tight tracking-[-0.02em] text-fg">
                You&apos;re set{firstName ? `, ${firstName}` : ""}
              </h2>
              <p className="text-[15px] leading-relaxed text-muted">
                Next: watch the welcome video, take your day 1 photos and do your food shop.
                Your 14 days begin when you tap <span className="font-semibold text-fg">Start my 14 days</span>,
                so start on a day you can train.
              </p>
            </div>
            <button type="button" onClick={leave} className={`btn-shine ${PRIMARY}`}>
              Get set up and start
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const PRIMARY =
  "w-full rounded-2xl bg-accent px-4 py-3.5 text-center text-[16px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98]";
const TEXT_BUTTON = "self-center py-1 text-[15px] font-semibold text-dim transition-colors hover:text-fg";
const FIELD =
  "w-full rounded-xl bg-fg/10 px-3.5 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60";

function EquipmentOption({ title, body, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center justify-between gap-3 rounded-2xl bg-fg/10 px-4 py-3.5 text-left transition-[background-color,transform] hover:bg-fg/15 active:scale-[0.99] disabled:opacity-60"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-[16px] font-semibold text-fg">{title}</span>
        <span className="text-[13px] text-muted">{body}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-dim" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}

function IconBell(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
      <path d="M10 20a2.2 2.2 0 0 0 4 0" />
    </svg>
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
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold tabular-nums text-black">
        {n}
      </span>
      <span className="pt-0.5 text-[15px] leading-snug text-muted">{children}</span>
    </li>
  );
}
