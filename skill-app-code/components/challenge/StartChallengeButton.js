"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startChallenge } from "@/app/(app)/challenge/actions";

// "Start my 14 days" - the single place the challenge clock begins.
// After it succeeds we refresh so the server re-reads the now-started
// state and swaps the prep screen for the live challenge.
export default function StartChallengeButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await startChallenge();
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="btn-shine w-full rounded-field bg-accent px-5 py-3.5 text-center font-display text-base font-bold text-black shadow-[0_8px_24px_-8px_rgba(252,118,5,0.6)] transition-transform active:scale-[0.99] disabled:opacity-70"
      >
        {pending ? "Starting..." : "Start my 14 days"}
      </button>
      <p className="text-center text-[11px] text-dim">
        This begins your day 1. The counter and checklist start now.
      </p>
      {error ? (
        <p className="text-center text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
