"use client";

import { useRef, useState } from "react";
import { saveProfile } from "@/app/(app)/profile/actions";
import { FITNESS_GOALS, EXPERIENCE_LEVELS } from "@/lib/profileOptions";
import { COUNTRIES, splitPhone } from "@/lib/countries";
import DialCodeField from "@/components/profile/DialCodeField";
import { Group, Row, rowInput, rowSelect, PickerChevron } from "@/components/ui/Grouped";

export default function ProfileForm({ initial }) {
  const [fullName, setFullName] = useState(initial.fullName);
  const [age, setAge] = useState(initial.age);
  const [country, setCountry] = useState(initial.country);
  const [fitnessGoal, setFitnessGoal] = useState(initial.fitnessGoal);
  const [experienceLevel, setExperienceLevel] = useState(initial.experienceLevel);
  const [unit, setUnit] = useState(initial.unitPreference === "lb" ? "lb" : "kg");
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
    fd.set("unitPreference", unit);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          aria-label="Change profile photo"
          className="relative h-24 w-24 overflow-hidden rounded-full bg-surface-2 transition-transform active:scale-95"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-dim">
              <IconUser className="h-10 w-10" />
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="text-[15px] font-semibold text-accent active:opacity-60"
        >
          Edit photo
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onPickPhoto}
          className="hidden"
        />
      </div>

      <Group title="About you">
        <Row label="Name" htmlFor="pf-name">
          <input
            id="pf-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className={rowInput}
          />
        </Row>
        <Row label="Age" htmlFor="pf-age">
          <input
            id="pf-age"
            type="number"
            inputMode="numeric"
            min="13"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Optional"
            className={`tabular-nums ${rowInput}`}
          />
        </Row>
        <Row label="Country" htmlFor="pf-country">
          <div className="relative flex w-full items-center">
            <select id="pf-country" value={country} onChange={(e) => setCountry(e.target.value)} className={rowSelect}>
              <option value="">Prefer not to say</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <PickerChevron />
          </div>
        </Row>
      </Group>

      <Group title="Training">
        <Row label="Goal" htmlFor="pf-goal">
          <div className="relative flex w-full items-center">
            <select id="pf-goal" value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} className={rowSelect}>
              <option value="">Prefer not to say</option>
              {FITNESS_GOALS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <PickerChevron />
          </div>
        </Row>
        <Row label="Experience" htmlFor="pf-exp">
          <div className="relative flex w-full items-center">
            <select id="pf-exp" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} className={rowSelect}>
              <option value="">Prefer not to say</option>
              {EXPERIENCE_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <PickerChevron />
          </div>
        </Row>
        <Row label="Units">
          <div role="radiogroup" aria-label="Weight units" className="flex w-32 rounded-[9px] bg-surface-2 p-0.5">
            {["kg", "lb"].map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                onClick={() => setUnit(u)}
                className={`flex-1 rounded-[7px] py-1 text-[13px] font-semibold transition-colors ${
                  unit === u ? "bg-fg text-bg shadow-sm" : "text-muted"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </Row>
      </Group>

      <Group title="Contact" footer="Your phone number is optional and only used for coaching follow-up.">
        <Row label="Email">
          <span className="truncate py-3 text-[16px] text-dim">{initial.email}</span>
        </Row>
        <Row label="Phone" htmlFor="pf-phone">
          <div className="flex w-full items-center justify-end gap-2">
            <div className="w-[5.5rem] shrink-0">
              <DialCodeField value={dial} onChange={setDial} bare />
            </div>
            <input
              id="pf-phone"
              type="tel"
              value={localPhone}
              onChange={(e) => setLocalPhone(e.target.value)}
              placeholder="Number"
              className={rowInput}
            />
          </div>
        </Row>
      </Group>

      <div className="flex flex-col gap-2">
        {error ? <p className="px-4 text-[14px] text-danger">{error}</p> : null}
        {saved ? <p className="px-4 text-[14px] text-good">Profile saved.</p> : null}
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-accent px-4 py-4 text-[16px] font-semibold text-black transition-[transform,background-color] duration-100 hover:bg-accent-2 active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </div>
    </form>
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
