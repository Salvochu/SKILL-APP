"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateChallengeVariant } from "@/app/(app)/profile/actions";
import { Group, rowButton } from "@/components/ui/Grouped";

// Lets a challenge account change equipment (Full Gym vs Dumbbells)
// after onboarding, since ChallengeWelcome only asks once. Only ever
// rendered for membership === "challenge" (see profile/page.js). An iOS
// style single-choice list: the picked row gets the checkmark.
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
    <Group
      title="Challenge equipment"
      footer={error ? <span className="text-danger">{error}</span> : "Switching applies from your next session."}
    >
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
    </Group>
  );
}

function EquipmentOption({ label, hint, selected, disabled, onClick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`${rowButton} py-2.5 disabled:opacity-60`}
    >
      <span className="flex flex-col">
        <span className="text-[16px] text-fg">{label}</span>
        <span className="text-[13px] text-dim">{hint}</span>
      </span>
      {selected ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5 9-10" />
        </svg>
      ) : null}
    </button>
  );
}
