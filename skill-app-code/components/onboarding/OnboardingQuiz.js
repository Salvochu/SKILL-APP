"use client";

import { useState } from "react";
import Link from "next/link";
import { saveProfile, completeOnboarding } from "@/app/(app)/profile/actions";
import { FITNESS_GOALS, EXPERIENCE_LEVELS } from "@/lib/profileOptions";
import { COUNTRIES } from "@/lib/countries";
import { isIOS, isAndroid, isStandalone } from "@/lib/pushClient";
import DialCodeField from "@/components/profile/DialCodeField";
import ImageModal from "@/components/onboarding/ImageModal";

const STEPS = [
  { key: "fullName", question: "What should we call you?" },
  { key: "age", question: "How old are you?" },
  { key: "country", question: "Where are you training from?" },
  { key: "fitnessGoal", question: "What is your main goal?" },
  { key: "experienceLevel", question: "How experienced are you with training?" },
  { key: "phone", question: "Want coaching tips and updates? Leave your number." },
];

// A short, one-question-at-a-time version of the Profile form, shown
// once on a new account's first Dashboard visit (OnboardingGate.js).
// Every question is skippable, individually or all at once: this is
// meant to make a good profile easy to fill in, not to gate the app.
// On a phone browser it ends with how to add SKILL to the Home Screen
// (same screenshots as the challenge welcome), whether the questions
// were answered or skipped.
export default function OnboardingQuiz({ show = false, initialName = "", initialAge = "" }) {
  // Latch on the first render where onboarding is needed. Finishing the
  // quiz flips `show` to false server-side, but the flow (including the
  // handoff screen) must stay mounted until the user dismisses it.
  const [latched] = useState(show);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  // The Home Screen step, when showing: { platform, then }, where then
  // is "done" (on to the You're all set screen) or "close" (they skipped).
  const [homeStep, setHomeStep] = useState(null);
  // The "How SKILL works" cards, when showing: "done" or "close", same
  // meaning as homeStep.then. They come before the Home Screen step.
  const [tour, setTour] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    fullName: initialName,
    age: initialAge,
    country: "",
    fitnessGoal: "",
    experienceLevel: "",
    phone: "",
  });
  // A name or age already on file (e.g. a challenge graduate, or one GHL
  // sent over from the opt-in form) does not need asking again - skip
  // straight past whichever question that is.
  const skip = new Set([
    initialName.trim() ? "fullName" : null,
    String(initialAge).trim() ? "age" : null,
  ]);
  const steps = STEPS.filter((s) => !skip.has(s.key));
  const [dial, setDial] = useState("");
  const [saving, setSaving] = useState(false);

  if (dismissed || (!latched && !show)) return null;

  const firstName = answers.fullName.trim().split(/\s+/)[0] || "";
  const isBeginner = answers.experienceLevel === "Beginner";

  if (tour) {
    return (
      <HowItWorks
        onFinish={() => {
          const then = tour;
          setTour(null);
          const platform = homeScreenPlatform();
          if (platform) setHomeStep({ platform, then });
          else if (then === "done") setDone(true);
          else setDismissed(true);
        }}
      />
    );
  }

  if (homeStep) {
    return (
      <HomeScreenStep
        platform={homeStep.platform}
        onContinue={() => {
          if (homeStep.then === "done") setDone(true);
          else setDismissed(true);
          setHomeStep(null);
        }}
      />
    );
  }

  if (done) {
    return (
      <Panel label="You're all set">
        <span className="check-pop flex h-12 w-12 items-center justify-center rounded-full bg-accent text-black">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h2 className="font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
          You&apos;re all set{firstName ? `, ${firstName}` : ""}
        </h2>

        {isBeginner ? (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              New to lifting? Start with <span className="font-semibold text-fg">Foundations</span>, your first
              month. Two full-body days, three times a week. Learn the main lifts and add a little weight each
              session. That is the whole plan.
            </p>
            <Link href="/splits" onClick={leaveHandoff} className={PRIMARY}>
              Start with Foundations
            </Link>
            <button type="button" onClick={leaveHandoff} className={TEXT_BUTTON}>
              I&apos;ll look around first
            </button>
          </>
        ) : (
          <>
            <p className="text-[15px] leading-relaxed text-muted">
              Ready to train? Pick a program to follow, or jump straight into a session.
            </p>
            <Link href="/splits" onClick={leaveHandoff} className={PRIMARY}>
              Choose a program
            </Link>
            <button type="button" onClick={leaveHandoff} className={TEXT_BUTTON}>
              Explore the app
            </button>
          </>
        )}
      </Panel>
    );
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function setAnswer(value) {
    setAnswers((a) => ({ ...a, [current.key]: value }));
  }

  async function finish() {
    setSaving(true);
    const fd = new FormData();
    fd.set("fullName", answers.fullName);
    fd.set("age", answers.age);
    fd.set("country", answers.country);
    fd.set("fitnessGoal", answers.fitnessGoal);
    fd.set("experienceLevel", answers.experienceLevel);
    fd.set("phone", answers.phone.trim() ? `${dial} ${answers.phone.trim()}`.trim() : "");
    // Mark onboarding done now, so closing the app on the handoff screen
    // does not drop them back at question 1. `latched` keeps this flow
    // mounted through the re-render that follows.
    fd.set("completeOnboarding", "1");
    await saveProfile(fd);
    setSaving(false);
    setTour("done");
  }

  // Close the flow. Navigation (when there is any) is a real <Link>, so
  // it survives this component unmounting.
  function leaveHandoff() {
    setDismissed(true);
  }

  function next() {
    if (isLast) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }
  async function skipAll() {
    // Skipping the questions still shows how the app works and the Home
    // Screen tip: both matter more than any of the profile answers.
    setTour("close");
    await completeOnboarding();
  }

  return (
    <Panel label="Tell us about yourself" onBackdrop={skipAll}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 gap-1">
          {steps.map((s, i) => (
            <span
              key={s.key}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-fg/15"}`}
            />
          ))}
        </div>
        <button type="button" onClick={skipAll} className="shrink-0 text-[13px] font-semibold text-dim hover:text-fg">
          Skip for now
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-dim">
          Question {step + 1} of {steps.length}
        </span>
        <h2 className="text-balance font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
          {current.question}
        </h2>
      </div>

      <QuestionInput
        key={current.key}
        step={current}
        value={answers[current.key]}
        dial={dial}
        onDialChange={setDial}
        onChange={setAnswer}
      />

      <div className="flex gap-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={back}
            className="rounded-2xl bg-fg/10 px-5 py-3.5 text-[16px] font-semibold text-fg transition-transform active:scale-[0.98]"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={next}
          disabled={saving}
          className="flex-1 rounded-2xl bg-accent px-4 py-3.5 text-[16px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98] disabled:opacity-60"
        >
          {isLast ? (saving ? "Saving..." : "Finish") : "Next"}
        </button>
      </div>
    </Panel>
  );
}

// Only a phone browser that isn't already running SKILL from the Home
// Screen gets the extra step.
function homeScreenPlatform() {
  if (isStandalone()) return null;
  if (isIOS()) return "ios";
  if (isAndroid()) return "android";
  return null;
}

// "Add SKILL to your Home Screen": the steps for this phone, plus the
// screenshot behind a button. On iPhone it matters most (only a Home
// Screen app can send reminders there); on Android it's a nice to have.
function HomeScreenStep({ platform, onContinue }) {
  const [showShot, setShowShot] = useState(false);
  const ios = platform === "ios";
  return (
    <Panel label="Add SKILL to your Home Screen">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black">
        <IconAddSquare className="h-6 w-6" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          {ios ? "One more thing" : "Optional"}
        </span>
        <h2 className="text-balance font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
          Add SKILL to your Home Screen
        </h2>
        <p className="mt-1 text-[15px] leading-relaxed text-muted">
          {ios
            ? "It opens full screen like a real app, and it's the only way iPhone lets SKILL send you training reminders."
            : "It opens full screen like a real app, instead of a browser tab."}
        </p>
      </div>

      <ol className="flex flex-col overflow-hidden rounded-2xl bg-fg/5 [&>li+li]:border-t [&>li+li]:border-fg/10">
        {(ios
          ? [
              <>
                Tap the <span className="font-semibold text-fg">Share</span> button
                <IconShare className="mx-1 inline h-4 w-4 align-[-2px] text-accent" />
                in your browser
              </>,
              <>
                Scroll down and tap <span className="font-semibold text-fg">Add to Home Screen</span>
              </>,
              <>From now on, open SKILL from your Home Screen</>,
            ]
          : [
              <>
                Tap the <span className="font-semibold text-fg">⋮</span> menu at the top of Chrome
              </>,
              <>
                Tap <span className="font-semibold text-fg">Add to Home screen</span> (or{" "}
                <span className="font-semibold text-fg">Install app</span>)
              </>,
              <>From now on, open SKILL from your Home Screen</>,
            ]
        ).map((text, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold tabular-nums text-black">
              {i + 1}
            </span>
            <span className="pt-0.5 text-[15px] leading-snug text-muted">{text}</span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setShowShot(true)}
        className="flex items-center justify-center gap-1.5 rounded-2xl bg-fg/10 py-3 text-[15px] font-semibold text-fg transition-transform active:scale-[0.98]"
      >
        <IconImage className="h-4 w-4" />
        Show me a screenshot
      </button>
      <button type="button" onClick={onContinue} className={PRIMARY}>
        {ios ? "Done" : "Continue"}
      </button>

      {showShot ? (
        <ImageModal
          src={ios ? "/onboarding/add-to-home-ios.jpg" : "/onboarding/add-to-home-android.jpg"}
          alt={
            ios
              ? "Safari share sheet with Add to Home Screen highlighted"
              : "Chrome menu with Install and create shortcut highlighted"
          }
          onClose={() => setShowShot(false)}
        />
      ) : null}
    </Panel>
  );
}

const PRIMARY =
  "w-full rounded-2xl bg-accent px-4 py-3.5 text-center text-[16px] font-semibold text-black transition-[transform,background-color] hover:bg-accent-2 active:scale-[0.98]";
const TEXT_BUTTON = "self-center py-1 text-[15px] font-semibold text-dim transition-colors hover:text-fg";

// A first look at the app for a new member, one card at a time: where
// the plan lives, logging a workout, seeing progress, form videos.
const TOUR = [
  {
    title: "Pick your plan",
    body: "Open Train and choose a program. It lays out your week for you: every day comes with its exercises, sets and reps already set.",
    icon: IconTourPlan,
  },
  {
    title: "Log as you lift",
    body: "Start the day's workout and your weight and reps from last time are already filled in, so you know exactly what to beat. Change what you need and log each set.",
    icon: IconTourLog,
  },
  {
    title: "Watch it add up",
    body: "Progress charts your strength and training volume week by week. Body keeps your weight, measurements and progress photos in one place.",
    icon: IconTourProgress,
  },
  {
    title: "Never guess a lift",
    body: "Tap any exercise to see a short form video and how to do it. The full Library is in Menu whenever you want to browse.",
    icon: IconTourPlay,
  },
];

function HowItWorks({ onFinish }) {
  const [i, setI] = useState(0);
  const card = TOUR[i];
  const last = i === TOUR.length - 1;
  const Icon = card.icon;
  return (
    <Panel label="How SKILL works">
      <div className="flex items-center justify-between gap-3">
        <span className="font-sans text-[13px] font-semibold uppercase tracking-[0.06em] text-accent">
          How SKILL works
        </span>
        <button type="button" onClick={onFinish} className="text-[15px] font-semibold text-dim transition-colors hover:text-fg">
          Skip
        </button>
      </div>

      <div key={i} className="pop-in flex flex-col gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-black">
          <Icon className="h-6 w-6" />
        </span>
        <h2 className="text-balance font-display text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-fg">
          {card.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-muted">{card.body}</p>
      </div>

      <div className="flex justify-center gap-1.5" aria-label={`Card ${i + 1} of ${TOUR.length}`}>
        {TOUR.map((c, n) => (
          <span
            key={c.title}
            className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-5 bg-accent" : "w-1.5 bg-fg/20"}`}
          />
        ))}
      </div>

      <div className="flex gap-2">
        {i > 0 ? (
          <button
            type="button"
            onClick={() => setI(i - 1)}
            className="flex-1 rounded-2xl bg-fg/10 px-4 py-3.5 text-[16px] font-semibold text-fg transition-transform active:scale-[0.98]"
          >
            Back
          </button>
        ) : null}
        <button type="button" onClick={() => (last ? onFinish() : setI(i + 1))} className={`${PRIMARY} flex-1`}>
          {last ? "Got it" : "Next"}
        </button>
      </div>
    </Panel>
  );
}

function IconTourPlan(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M8 3v4M16 3v4M3.5 10h17M8 14.5h3M8 17h6" />
    </svg>
  );
}
function IconTourLog(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
    </svg>
  );
}
function IconTourProgress(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19h16M5 15l4.5-4.5 3.5 3L19 7" />
      <path d="M14.5 7H19v4.5" />
    </svg>
  );
}
function IconTourPlay(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.5 9.5v5l4-2.5z" fill="currentColor" />
    </svg>
  );
}

// The sheet every screen of this flow sits in: thick glass over a dimmed
// page, rising from the bottom on a phone.
function Panel({ label, onBackdrop = null, children }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {onBackdrop ? (
        <button
          type="button"
          aria-label="Skip for now"
          onClick={onBackdrop}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
      ) : (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      )}
      <div className="glass-strong relative flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-[28px] p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-3xl sm:pb-6">
        {children}
      </div>
    </div>
  );
}

const FIELD =
  "w-full rounded-xl bg-fg/10 px-3.5 py-3 text-[16px] text-fg outline-none placeholder:text-dim focus:ring-2 focus:ring-accent/60";

function QuestionInput({ step, value, dial, onDialChange, onChange }) {
  if (step.key === "age") {
    return (
      <input
        type="number"
        inputMode="numeric"
        min="13"
        max="100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        placeholder="Age"
        className={`tabular-nums ${FIELD}`}
      />
    );
  }

  if (step.key === "country") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} autoFocus className={`appearance-none ${FIELD}`}>
        <option value="">Prefer not to say</option>
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.name}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
    );
  }

  if (step.key === "fitnessGoal" || step.key === "experienceLevel") {
    const options = step.key === "fitnessGoal" ? FITNESS_GOALS : EXPERIENCE_LEVELS;
    return (
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold transition-[background-color,color,transform] active:scale-[0.99] ${
              value === opt ? "bg-accent text-black" : "bg-fg/10 text-fg hover:bg-fg/15"
            }`}
          >
            {opt}
            {value === opt ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : null}
          </button>
        ))}
      </div>
    );
  }

  if (step.key === "phone") {
    return (
      <div className="grid grid-cols-[8.5rem_minmax(0,1fr)] gap-2">
        <DialCodeField value={dial} onChange={onDialChange} filled />
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          placeholder="Phone number"
          className={`min-w-0 ${FIELD}`}
        />
      </div>
    );
  }

  // fullName
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoFocus
      placeholder="Your name"
      className={FIELD}
    />
  );
}

function IconAddSquare(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8.5v7M8.5 12h7" />
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
