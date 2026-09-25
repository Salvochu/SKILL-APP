"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateChallengeVariant } from "@/app/(app)/profile/actions";

// Lets a challenge account change equipment (Full Gym vs Dumbbells)
// after onboarding, since ChallengeWelcome only asks once. Only ever
// rendered for membership === "challenge" (see profile/page.js).
export default function ChallengeEquipmentCard({ variant: initialVariant }) {
  const router = useRouter();
  const [variant, setVariant] = useState(initialVariant);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function pick(equipment) {
    if (equipment === variant || saving) return;
    setSaving(true);
    setError(null);
    const res = await updateChallengeVariant(equipment);
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    setVariant(res.variant);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-dim">
        Challenge equipment
      </h2>
      <p className="text-sm text-muted">
        Which version of each workout you get. Switching applies from your next session.
      </p>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex flex-col gap-2.5">
        <EquipmentOption
          label="Full gym"
          hint="Barbells, machines, the lot"
          selected={variant === "Full Gym"}
          disabled={saving}
          onClick={() => pick("Full Gym")}
        />
        <EquipmentOption
          label="At home"
          hint="A pair of dumbbells is all you need"
          selected={variant === "Dumbbells"}
          disabled={saving}
          onClick={() => pick("Dumbbells")}
        />
      </div>
    </section>
  );
}

function EquipmentOption({ label, hint, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col gap-0.5 rounded-field border px-4 py-3.5 text-left transition-colors disabled:opacity-60 ${
        selected
          ? "border-accent bg-accent-soft"
          : "border-border hover:border-accent hover:bg-accent-soft"
      }`}
    >
      <span className="text-sm font-semibold text-fg">{label}</span>
      <span className="text-xs text-dim">{hint}</span>
    </button>
  );
}
