"use client";

import { useState } from "react";
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
export default function OnboardingQuiz() {
  const [visible, setVisible] = useState(true);
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

  if (!visible) return null;

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
    fd.set("completeOnboarding", "1");
    await saveProfile(fd);
    setSaving(false);
    setVisible(false);
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
    setVisible(false);
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
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col gap-5 overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 sm:rounded-2xl">
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
