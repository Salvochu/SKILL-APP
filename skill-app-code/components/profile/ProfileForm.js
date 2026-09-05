"use client";

import { useRef, useState } from "react";
import { saveProfile } from "@/app/(app)/profile/actions";
import { FITNESS_GOALS, EXPERIENCE_LEVELS } from "@/lib/profileOptions";
import { COUNTRIES, splitPhone } from "@/lib/countries";

export default function ProfileForm({ initial }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [age, setAge] = useState(initial.age);
  const [country, setCountry] = useState(initial.country);
  const [fitnessGoal, setFitnessGoal] = useState(initial.fitnessGoal);
  const [experienceLevel, setExperienceLevel] = useState(initial.experienceLevel);
  const initialPhone = splitPhone(initial.phone);
  const [dial, setDial] = useState(initialPhone.dial);
  const [localPhone, setLocalPhone] = useState(initialPhone.local);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileInput = useRef(null);

  function onPickPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const phone = localPhone.trim() ? `${dial} ${localPhone.trim()}`.trim() : "";

    const fd = new FormData();
    fd.set("fullName", fullName);
    fd.set("age", age);
    fd.set("country", country);
    fd.set("fitnessGoal", fitnessGoal);
    fd.set("experienceLevel", experienceLevel);
    fd.set("phone", phone);
    if (avatarFile) fd.set("avatar", avatarFile);

    const result = await saveProfile(fd);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    if (result?.avatarUrl) setAvatarUrl(result.avatarUrl);
    setAvatarFile(null);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label="Change profile photo"
          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-surface-2"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-dim">
              <IconUser className="h-7 w-7" />
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="self-start rounded-field border border-border px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface-2"
          >
            Change photo
          </button>
          <span className="text-xs text-dim">JPG or PNG, up to 5MB.</span>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPickPhoto}
            className="hidden"
          />
        </div>
      </div>

      <Field label="Email">
        <span className="rounded-field border border-border bg-surface-2 px-3 py-2 text-sm text-muted">
          {initial.email}
        </span>
      </Field>

      <Field label="Name">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Age" className="min-w-0">
          <input
            type="number"
            inputMode="numeric"
            min="13"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="tabular w-full min-w-0 rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
          />
        </Field>
        <Field label="Country" className="min-w-0">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full min-w-0 rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
          >
            <option value="">Prefer not to say</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Fitness goal">
        <select
          value={fitnessGoal}
          onChange={(e) => setFitnessGoal(e.target.value)}
          className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
        >
          <option value="">Prefer not to say</option>
          {FITNESS_GOALS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Training experience">
        <select
          value={experienceLevel}
          onChange={(e) => setExperienceLevel(e.target.value)}
          className="w-full rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent"
        >
          <option value="">Prefer not to say</option>
          {EXPERIENCE_LEVELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Phone">
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-2">
          <select
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            aria-label="Country code"
            className="w-full min-w-0 rounded-field border border-border bg-bg px-2 py-2 text-sm text-fg focus:border-accent"
          >
            <option value="">Code</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.flag} {c.dial}
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={localPhone}
            onChange={(e) => setLocalPhone(e.target.value)}
            placeholder="For coaching follow-up, optional"
            className="w-full min-w-0 rounded-field border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-dim focus:border-accent"
          />
        </div>
      </Field>

      {error ? (
        <p className="rounded-field border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-field border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent">
          Profile saved.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-field bg-accent px-4 py-2.5 font-semibold text-black transition-colors hover:bg-accent-2 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}

function Field({ label, className = "", children }) {
  return (
    <label className={`flex flex-col gap-1.5 text-sm font-medium text-muted ${className}`}>
      {label}
      {children}
    </label>
  );
}

function IconUser(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}
