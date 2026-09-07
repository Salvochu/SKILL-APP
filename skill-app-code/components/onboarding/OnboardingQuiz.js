"use client";

import { useState } from "react";
import Link from "next/link";
import { saveProfile, completeOnboarding } from "@/app/(app)/profile/actions";
import { FITNESS_GOALS, EXPERIENCE_LEVELS } from "@/lib/profileOptions";
import { COUNTRIES } from "@/lib/countries";
import DialCodeField from "@/components/profile/DialCodeField";

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
export default function OnboardingQuiz({ show = false }) {
  // Latch on the first render where onboarding is needed. Finishing the
  // quiz flips `show` to false server-side, but the flow (including the
  // handoff screen) must stay mounted until the user dismisses it.
  const [latched] = useState(show);
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    fullName: "",
    age: "",
    country: "",
    fitnessGoal: "",
    experienceLevel: "",
    phone: "",
  });
  const [dial, setDial] = useState("");
  const [saving, setSaving] = useState(false);

  if (dismissed || (!latched && !show)) return null;

  const firstName = answers.fullName.trim().split(/\s+/)[0] || "";
  const isBeginner = answers.experienceLevel === "Beginner";

  if (done) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
        role="dialog"
        aria-modal="true"
        aria-label="You're all set"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative flex w-full max-w-md flex-col gap-4 rounded-t-2xl border border-border bg-surface p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h2 className="font-display text-xl font-semibold text-fg">
            You&apos;re all set{firstName ? `, ${firstName}` : ""}
          </h2>

          {isBeginner ? (
            <>
              <p className="text-sm text-muted">
                New to lifting? Start with <span className="font-semibold text-fg">Foundations</span> - your
                first month. Two full-body days, three times a week. Learn the main lifts and add a little
                weight each session. That is the whole plan.
              </p>
              <Link
                href="/splits"
                onClick={leaveHandoff}
                className="w-full rounded-field bg-accent px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-accent-2"
              >
                Start with Foundations
              </Link>
              <button
                type="button"
                onClick={leaveHandoff}
                className="self-center text-xs font-medium text-dim hover:text-fg"
              >
                I&apos;ll look around first
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">
                Ready to train? Pick a program to follow, or jump straight into a session.
              </p>
              <Link
                href="/splits"
                onClick={leaveHandoff}
                className="w-full rounded-field bg-accent px-4 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-accent-2"
              >
                Choose a program
              </Link>
              <button
                type="button"
                onClick={leaveHandoff}
                className="self-center text-xs font-medium text-dim hover:text-fg"
              >
                Explore the app
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

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
    setDone(true);
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
    setDismissed(true);
    await completeOnboarding();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Tell us about yourself"
    >
      <button
        type="button"
        aria-label="Skip for now"
        onClick={skipAll}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <span key={s.key} className={`h-1 w-6 rounded-full ${i <= step ? "bg-accent" : "bg-surface-2"}`} />
            ))}
          </div>
          <button type="button" onClick={skipAll} className="shrink-0 text-xs font-medium text-dim hover:text-fg">
            Skip for now
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-dim">
            Question {step + 1} of {STEPS.length}
          </span>
          <h2 className="font-display text-xl font-semibold text-fg">{current.question}</h2>
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
              className="rounded-field border border-border px-4 py-2.5 text-sm font-medium text-fg hover:bg-surface-2"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={next}
            disabled={saving}
            className="flex-1 rounded-field bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
          >
            {isLast ? (saving ? "Saving..." : "Finish") : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        className="tabular w-full rounded-field border border-border bg-bg px-3 py-2.5 text-sm text-fg focus:border-accent"
      />
    );
  }

  if (step.key === "country") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
        className="w-full rounded-field border border-border bg-bg px-3 py-2.5 text-sm text-fg focus:border-accent"
      >
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
            className={`rounded-field border px-4 py-3 text-left text-sm font-medium transition-colors ${
              value === opt ? "border-accent bg-accent-soft text-accent" : "border-border text-fg hover:bg-surface-2"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (step.key === "phone") {
    return (
      <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] gap-2">
        <DialCodeField value={dial} onChange={onDialChange} />
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          placeholder="Phone number"
          className="w-full min-w-0 rounded-field border border-border bg-bg px-3 py-2.5 text-sm text-fg focus:border-accent"
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
      className="w-full rounded-field border border-border bg-bg px-3 py-2.5 text-sm text-fg focus:border-accent"
    />
  );
}
