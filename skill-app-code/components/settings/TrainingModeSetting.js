"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdvancedTracking } from "@/app/(app)/profile/actions";
import { Group } from "@/components/ui/Grouped";
import Switch from "@/components/ui/Switch";

// The switch between the simple app and the full one. On = reps in
// reserve in the logger, program weeks and RIR targets, the strength
// benchmark, and the trend charts on Progress. Off keeps all of that
// hidden and swaps the RIR box for a "taken to failure" tap.
export default function TrainingModeSetting({ initialAdvanced, isExplicit }) {
  const router = useRouter();
  const [advanced, setAdvanced] = useState(initialAdvanced);
  const [chosen, setChosen] = useState(isExplicit);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function toggle(next) {
    setAdvanced(next);
    setPending(true);
    setError(null);
    const res = await setAdvancedTracking(next);
    setPending(false);
    if (res?.error) {
      setAdvanced(!next);
      setError(res.error);
      return;
    }
    setChosen(true);
    // Push the new value through every server component (the logger's
    // RIR column, the dashboard, Progress) without a manual reload.
    router.refresh();
  }

  return (
    <Group
      title="Training detail"
      footer={
        <>
          Reps in reserve, program weeks, the strength benchmark, and trend charts. Off keeps things simple
          and lets you just mark a set as taken to failure.
          {!chosen ? ` ${advanced ? "On" : "Off"} by default for your experience level. Flip it any time.` : ""}
          {error ? <span className="mt-1 block text-danger">{error}</span> : null}
        </>
      }
    >
      <div className="flex min-h-[50px] items-center justify-between gap-4 px-4 py-2">
        <span className="text-[16px] text-fg">Advanced tracking</span>
        <Switch checked={advanced} onChange={toggle} label="Advanced tracking" disabled={pending} />
      </div>
    </Group>
  );
}
